import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import type { PageResponse } from "../core/api/page-response";
import type { Station, StationMaj, StationWrite } from "./station";

@Injectable({ providedIn: "root" })
export class StationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/stations`;

  list(args: {
    page: number;
    q?: string;
    size: number;
  }): Promise<PageResponse<Station>> {
    const params: Record<string, string | number> = {
      page: args.page,
      size: args.size,
    };
    if (args.q?.trim()) {
      params["q"] = args.q.trim();
    }
    return firstValueFrom(
      this.http.get<PageResponse<Station>>(this.baseUrl, { params })
    );
  }

  get(id: string): Promise<Station> {
    return firstValueFrom(this.http.get<Station>(`${this.baseUrl}/${id}`));
  }

  create(body: StationWrite): Promise<Station> {
    return firstValueFrom(this.http.post<Station>(this.baseUrl, body));
  }

  update(id: string, body: StationMaj): Promise<Station> {
    return firstValueFrom(
      this.http.put<Station>(`${this.baseUrl}/${id}`, body)
    );
  }

  deactivate(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
