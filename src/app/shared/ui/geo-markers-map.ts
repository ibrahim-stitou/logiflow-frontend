import {
  type AfterViewInit,
  booleanAttribute,
  Component,
  DestroyRef,
  type ElementRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
// biome-ignore lint/performance/noNamespaceImport: Leaflet is published as a single CommonJS namespace.
import * as L from "leaflet";
import {
  DEFAULT_SITE_LOCALISATION,
  isValidLocalisation,
  SITE_MAP_ZOOM,
} from "../../sites/site-localisation";

const GEO_MARKER_ICON = L.icon({
  iconAnchor: [12, 41],
  iconRetinaUrl: "/assets/leaflet/marker-icon-2x.png",
  iconSize: [25, 41],
  iconUrl: "/assets/leaflet/marker-icon.png",
  popupAnchor: [1, -34],
  shadowAnchor: [12, 41],
  shadowSize: [41, 41],
  shadowUrl: "/assets/leaflet/marker-shadow.png",
});

export interface GeoMapMarker {
  readonly id?: string;
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface GeoMapPathPoint {
  readonly latitude: number;
  readonly longitude: number;
}

const ROUTE_POLYLINE_COLOR = "#215544";

@Component({
  selector: "app-geo-markers-map",
  styles: `
    :host {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      width: 100%;
      min-height: 18rem;
      border-radius: inherit;
    }

    /* Flush inset in a sized parent: fill remaining height instead of a fixed square. */
    :host:has(.map-host--embedded) {
      min-height: 0;
      height: 100%;
    }

    .map-host {
      flex: 1 1 auto;
      width: 100%;
      min-height: 18rem;
      z-index: 0;
      overflow: hidden;
    }

    .map-host--embedded {
      min-height: 0;
      border: none;
      border-radius: inherit;
      background: color-mix(in oklch, var(--color-canvas) 42%, var(--color-surface));
      box-shadow:
        inset 0 0 0 1px oklch(0 0 0 / 0.1),
        0 1px 2px oklch(0 0 0 / 0.04);
    }

    :host-context(.dark) .map-host--embedded {
      box-shadow:
        inset 0 0 0 1px oklch(1 0 0 / 0.1),
        0 1px 2px oklch(0 0 0 / 0.2);
    }

    .map-host ::ng-deep .leaflet-container {
      border-radius: inherit;
    }

    :host ::ng-deep .leaflet-control-attribution {
      font-size: 0.65rem;
    }
  `,
  template: `
    <div
      #mapHost
      [attr.aria-label]="ariaLabel()"
      [class.map-host--embedded]="embedded()"
      [class.surface-panel]="!embedded()"
      class="map-host"
      role="application"
    ></div>
  `,
})
export class GeoMarkersMap implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly markers = input.required<readonly GeoMapMarker[]>();
  readonly path = input<readonly GeoMapPathPoint[]>([]);
  readonly focusId = input<string | null>(null);
  readonly ariaLabel = input("Carte");
  /** Flush inset inside a parent card (no outer surface-panel frame). */
  readonly embedded = input(false, { transform: booleanAttribute });

  private readonly mapHost =
    viewChild.required<ElementRef<HTMLElement>>("mapHost");

  private map: L.Map | null = null;
  private readonly layer = L.layerGroup();
  private readonly markersById = new Map<string, L.Marker>();
  private readonly mapReady = signal(false);
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const next = this.markers();
      const path = this.path();
      const focusId = this.focusId();
      if (!this.mapReady()) {
        return;
      }
      this.renderMapContent(next, path);
      this.focusMarker(focusId);
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.observeMapHostSize();
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.resizeObserver = undefined;
      this.map?.remove();
      this.map = null;
      this.markersById.clear();
      this.mapReady.set(false);
    });
  }

  /** Call after the host layout changes (e.g. tab panel shown). */
  refreshLayout(): void {
    requestAnimationFrame(() => {
      this.map?.invalidateSize();
      requestAnimationFrame(() => this.map?.invalidateSize());
    });
  }

  private observeMapHostSize(): void {
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const host = this.mapHost().nativeElement;
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.mapReady()) {
        return;
      }
      this.refreshLayout();
    });
    this.resizeObserver.observe(host);
  }

  private initMap(): void {
    const host = this.mapHost().nativeElement;
    this.map = L.map(host, {
      center: L.latLng(
        DEFAULT_SITE_LOCALISATION.latitude,
        DEFAULT_SITE_LOCALISATION.longitude
      ),
      scrollWheelZoom: true,
      zoom: SITE_MAP_ZOOM - 4,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    this.layer.addTo(this.map);
    this.mapReady.set(true);
    this.renderMapContent(this.markers(), this.path());
    this.focusMarker(this.focusId());

    this.refreshLayout();
  }

  private renderMapContent(
    markers: readonly GeoMapMarker[],
    path: readonly GeoMapPathPoint[]
  ): void {
    if (!this.map) {
      return;
    }

    this.layer.clearLayers();
    this.markersById.clear();
    const boundsPoints: L.LatLngExpression[] = [];

    const routePoints = this.resolvePathPoints(path);
    if (routePoints.length >= 2) {
      L.polyline(routePoints, {
        color: ROUTE_POLYLINE_COLOR,
        opacity: 0.88,
        weight: 4,
      }).addTo(this.layer);
      boundsPoints.push(...routePoints);
    }

    for (const marker of markers) {
      if (!isValidLocalisation(marker.latitude, marker.longitude)) {
        continue;
      }
      const latLng = L.latLng(marker.latitude, marker.longitude);
      boundsPoints.push(latLng);
      const leafletMarker = L.marker(latLng, {
        icon: GEO_MARKER_ICON,
      }).bindPopup(marker.label);
      leafletMarker.addTo(this.layer);
      if (marker.id) {
        this.markersById.set(marker.id, leafletMarker);
      }
    }

    if (boundsPoints.length === 0) {
      this.map.setView(
        [
          DEFAULT_SITE_LOCALISATION.latitude,
          DEFAULT_SITE_LOCALISATION.longitude,
        ],
        SITE_MAP_ZOOM - 4
      );
      return;
    }

    if (boundsPoints.length === 1) {
      this.map.setView(boundsPoints[0], SITE_MAP_ZOOM - 2);
      return;
    }

    this.map.fitBounds(L.latLngBounds(boundsPoints), { padding: [36, 36] });
  }

  private resolvePathPoints(
    path: readonly GeoMapPathPoint[]
  ): L.LatLngExpression[] {
    if (path.length < 2) {
      return [];
    }

    const points: L.LatLngExpression[] = [];
    for (const point of path) {
      if (!isValidLocalisation(point.latitude, point.longitude)) {
        continue;
      }
      points.push(L.latLng(point.latitude, point.longitude));
    }
    return points;
  }

  private focusMarker(focusId: string | null): void {
    if (!(this.map && focusId)) {
      return;
    }
    const marker = this.markersById.get(focusId);
    if (!marker) {
      return;
    }
    const latLng = marker.getLatLng();
    this.map.panTo(latLng);
    marker.openPopup();
  }
}
