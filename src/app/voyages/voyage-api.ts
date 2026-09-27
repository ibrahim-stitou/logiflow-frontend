import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import type {
  EvenementVoyage,
  EvenementVoyageWrite,
  StatutVoyage,
  Voyage,
  VoyageWrite,
} from "./voyage";
import type {
  AjouterDossierVoyageWrite,
  VerifierAjoutDossierResult,
} from "./voyage-ajouter-dossier";

/**
 * Voyage HTTP surface: POST create, GET list/detail, PUT statut, POST événements.
 * No DELETE — cancel via statut ANNULE.
 *
 * Create payload (`VoyageRequest` / `VoyageWrite`):
 * - Required: `typeVoyage`, `portee`, `departPrevu`, `arriveePrevue`, `vehiculeId`,
 *   `dossierIds` (min 1), `trajet`, `affectations` (min 1).
 * - `remorqueId` optional.
 *
 * Backend next: VoyageRepositoryAdapter still save()s a new JPA row (version 0).
 * A second statut change 500s (optimistic lock) until it updates in place
 * like VehiculeRepositoryAdapter.
 */
@Service()
export class VoyageApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/voyages`;

  create(body: VoyageWrite): Promise<Voyage> {
    return firstValueFrom(this.http.post<Voyage>(this.baseUrl, body));
  }

  changerStatut(id: string, valeur: StatutVoyage): Promise<Voyage> {
    return firstValueFrom(
      this.http.put<Voyage>(`${this.baseUrl}/${id}/statut`, null, {
        params: { valeur },
      })
    );
  }

  declarerEvenement(body: EvenementVoyageWrite): Promise<EvenementVoyage> {
    return firstValueFrom(
      this.http.post<EvenementVoyage>(
        `${environment.apiBaseUrl}/evenements-voyage`,
        body
      )
    );
  }

  verifierAjoutDossier(
    voyageId: string,
    body: AjouterDossierVoyageWrite
  ): Promise<VerifierAjoutDossierResult> {
    return firstValueFrom(
      this.http.post<VerifierAjoutDossierResult>(
        `${this.baseUrl}/${voyageId}/dossiers/check`,
        body
      )
    );
  }

  ajouterDossier(
    voyageId: string,
    body: AjouterDossierVoyageWrite
  ): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/${voyageId}/dossiers`, body)
    );
  }
}
