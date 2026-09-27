import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import type { PageResponse } from "../core/api/page-response";
import type {
  PriseCarburant,
  PriseCarburantMaj,
  PriseCarburantStats,
  PriseCarburantWrite,
  StatutPrise,
} from "./prise-carburant";

@Injectable({ providedIn: "root" })
export class PriseCarburantApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/prises-carburant`;

  list(args: {
    page: number;
    q?: string;
    size: number;
    statut?: StatutPrise | null;
    voyageId?: string | null;
  }): Promise<PageResponse<PriseCarburant>> {
    const params: Record<string, string | number> = {
      page: args.page,
      size: args.size,
    };
    if (args.q?.trim()) {
      params["q"] = args.q.trim();
    }
    if (args.voyageId) {
      params["voyageId"] = args.voyageId;
    }
    if (args.statut) {
      params["statut"] = args.statut;
    }
    return firstValueFrom(
      this.http.get<PageResponse<PriseCarburant>>(this.baseUrl, { params })
    );
  }

  stats(args: {
    q?: string;
    statut?: StatutPrise | null;
    voyageId?: string | null;
  }): Promise<PriseCarburantStats> {
    const params: Record<string, string> = {};
    if (args.q?.trim()) {
      params["q"] = args.q.trim();
    }
    if (args.voyageId) {
      params["voyageId"] = args.voyageId;
    }
    if (args.statut) {
      params["statut"] = args.statut;
    }
    return firstValueFrom(
      this.http.get<PriseCarburantStats>(`${this.baseUrl}/stats`, { params })
    );
  }

  get(id: string): Promise<PriseCarburant> {
    return firstValueFrom(
      this.http.get<PriseCarburant>(`${this.baseUrl}/${id}`)
    );
  }

  create(body: PriseCarburantWrite): Promise<PriseCarburant> {
    return firstValueFrom(this.http.post<PriseCarburant>(this.baseUrl, body));
  }

  update(id: string, body: PriseCarburantMaj): Promise<PriseCarburant> {
    return firstValueFrom(
      this.http.put<PriseCarburant>(`${this.baseUrl}/${id}`, body)
    );
  }

  valider(id: string): Promise<PriseCarburant> {
    return firstValueFrom(
      this.http.post<PriseCarburant>(`${this.baseUrl}/${id}/valider`, {})
    );
  }
}
