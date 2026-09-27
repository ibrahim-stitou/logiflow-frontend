import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import type { Client, ClientWrite } from "../clients/client";
import { ClientApi } from "../clients/client-api";
import type { Commande, CommandeWrite } from "./commande";

/**
 * Commande HTTP surface: POST create, GET list/detail, PUT confirmer, PUT annuler.
 * Create requires at least one ligne (marchandiseId + poids/volume/colis).
 * No DELETE — cancel via PUT .../annuler.
 *
 * Backend next: CommandeRepositoryAdapter still save()s a new JPA row (version 0).
 * A second confirmer/annuler 500s (optimistic lock) until it updates in place
 * like VehiculeRepositoryAdapter.
 */
@Service()
export class CommandeApi {
  private readonly http = inject(HttpClient);
  private readonly clientApi = inject(ClientApi);
  private readonly baseUrl = `${environment.apiBaseUrl}/commandes`;

  createClient(body: ClientWrite): Promise<Client> {
    return this.clientApi.create(body);
  }

  getClient(id: string): Promise<Client> {
    return firstValueFrom(
      this.http.get<Client>(`${environment.apiBaseUrl}/clients/${id}`)
    );
  }

  create(body: CommandeWrite): Promise<Commande> {
    return firstValueFrom(this.http.post<Commande>(this.baseUrl, body));
  }

  confirmer(id: string): Promise<Commande> {
    return firstValueFrom(
      this.http.put<Commande>(`${this.baseUrl}/${id}/confirmer`, null)
    );
  }

  annuler(id: string): Promise<Commande> {
    return firstValueFrom(
      this.http.put<Commande>(`${this.baseUrl}/${id}/annuler`, null)
    );
  }
}
