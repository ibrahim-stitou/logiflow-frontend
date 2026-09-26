import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import type { Document, DocumentType, TypeEntiteDocumentable } from "./document";

/**
 * Document HTTP surface: multipart POST upload, GET list by entity, DELETE,
 * and authenticated binary download (`/contenu`).
 */
@Service()
export class DocumentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/documents`;

  lister(
    typeEntite: TypeEntiteDocumentable,
    entiteId: string
  ): Promise<Document[]> {
    return firstValueFrom(
      this.http.get<Document[]>(this.baseUrl, {
        params: { entiteId, typeEntite },
      })
    );
  }

  televerser(args: {
    dateExpiration?: string;
    entiteId: string;
    fichier: File;
    reference?: string;
    typeDocument: DocumentType;
    typeEntite: TypeEntiteDocumentable;
  }): Promise<Document> {
    let params = new HttpParams()
      .set("typeEntite", args.typeEntite)
      .set("entiteId", args.entiteId)
      .set("typeDocument", args.typeDocument);
    const reference = args.reference?.trim();
    if (reference) {
      params = params.set("reference", reference);
    }
    if (args.dateExpiration) {
      params = params.set("dateExpiration", args.dateExpiration);
    }

    const formData = new FormData();
    formData.append("fichier", args.fichier);

    return firstValueFrom(
      this.http.post<Document>(this.baseUrl, formData, { params })
    );
  }

  supprimer(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }

  /**
   * Ouvre le fichier dans un nouvel onglet via un blob authentifié.
   * Les URL stockées (`/fichiers/…`) ne sont pas routées vers le backend
   * depuis le front (proxy/Caddy ne forwardent que `/api/*`).
   */
  async ouvrir(id: string): Promise<void> {
    const blob = await firstValueFrom(
      this.http.get(`${this.baseUrl}/${id}/contenu`, {
        responseType: "blob",
      })
    );
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    // Keep the name for download fallbacks (some browsers ignore inline PDFs).
    if (blob.type && !blob.type.includes("pdf") && !blob.type.startsWith("image/")) {
      anchor.download = "document";
    }
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}
