import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import {
  type ListKeyboardRow,
  ListRowKeyboard,
  listKeyboardRows,
} from "./list-row-keyboard";

@Component({
  imports: [ListRowKeyboard],
  template: `
    <div
      appListRowKeyboard
      [(activeId)]="activeId"
      [rows]="rows"
      aria-label="Liste"
    >
      <table>
        <tbody>
          @for (row of rows; track row.id) {
          <tr>{{ row.id }}</tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
class Host {
  readonly activeId = signal<string | null>("a");
  readonly rows: ListKeyboardRow[] = [
    { id: "a", path: "/a" },
    { id: "b", path: "/b" },
  ];
}

describe("listKeyboardRows", () => {
  it("maps entities to keyboard rows", () => {
    expect(
      listKeyboardRows([{ id: "1" }, { id: "2" }], (item) => `/x/${item.id}`)
    ).toEqual([
      { id: "1", path: "/x/1" },
      { id: "2", path: "/x/2" },
    ]);
  });
});

describe("ListRowKeyboard", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([
          { component: Host, path: "a" },
          { component: Host, path: "b" },
        ]),
      ],
    }).compileComponents();
  });

  it("moves the active row with arrow keys and opens on Enter", async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const shell = host.querySelector("[appListRowKeyboard]") as HTMLElement;
    shell.focus();

    shell.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.activeId()).toBe("b");

    shell.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })
    );
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe("/b");
  });
});
