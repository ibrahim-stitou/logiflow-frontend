import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from "@angular/router";
import { provideZardCharts } from "@/shared/components/chart/chart-echarts.provider";
import { provideZard } from "@/shared/core/provider/providezard";
import { ZardDarkMode } from "@/shared/services/dark-mode";
import { routes } from "./app.routes";
import { provideLogiflowAuth } from "./core/auth/provide-logiflow-auth";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideLogiflowAuth(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: "enabled" })
    ),
    provideZard(),
    provideZardCharts(),
    provideAppInitializer(() => {
      inject(ZardDarkMode).init();
    }),
  ],
};
