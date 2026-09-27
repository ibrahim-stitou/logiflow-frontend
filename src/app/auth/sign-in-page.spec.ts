import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AUTH_DEMO_TEST_PROVIDERS } from "../core/auth/auth-test-providers";
import { DEMO_PASSWORD } from "../core/auth/demo-identity";
import {
  DEMO_SESSION_STORAGE_KEY,
  DemoSessionService,
} from "../core/auth/demo-session";
import { SignInPage } from "./sign-in-page";

describe("SignInPage", () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([{ children: [], path: "" }]),
        ...AUTH_DEMO_TEST_PROVIDERS,
      ],
    }).compileComponents();
  });

  it("fills credentials from a demo identity chip", () => {
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const chip = [...compiled.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("chauffeur")
    );
    expect(chip).toBeTruthy();
    chip?.click();
    fixture.detectChanges();
    const login = compiled.querySelector("#login") as HTMLInputElement;
    const password = compiled.querySelector("#password") as HTMLInputElement;
    expect(login.value).toBe("chauffeur");
    expect(password.value).toBe(DEMO_PASSWORD);
  });

  it("opens a Demo Session on valid submit", async () => {
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const chip = [...compiled.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("admin")
    );
    chip?.click();
    fixture.detectChanges();
    compiled
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    const session = TestBed.inject(DemoSessionService);
    expect(session.isSignedIn()).toBe(true);
    expect(sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY)).toContain("admin");
    expect(TestBed.inject(Router).url).toBe("/");
  });
});
