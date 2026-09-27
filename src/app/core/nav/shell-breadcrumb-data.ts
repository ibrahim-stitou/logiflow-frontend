export interface ShellBreadcrumbTrailItem {
  label: string;
  path?: string;
}

export interface ShellBreadcrumbRouteData {
  leaf?: string;
  trail: readonly ShellBreadcrumbTrailItem[];
}

export const shellBreadcrumb = {
  create(
    moduleLabel: string,
    listPath: string
  ): { shellBreadcrumb: ShellBreadcrumbRouteData } {
    return {
      shellBreadcrumb: {
        leaf: "Nouveau",
        trail: [{ label: moduleLabel, path: listPath }],
      },
    };
  },

  createNested(trail: readonly ShellBreadcrumbTrailItem[]): {
    shellBreadcrumb: ShellBreadcrumbRouteData;
  } {
    return {
      shellBreadcrumb: {
        leaf: "Nouveau",
        trail,
      },
    };
  },

  detail(
    moduleLabel: string,
    listPath: string
  ): { shellBreadcrumb: ShellBreadcrumbRouteData } {
    return {
      shellBreadcrumb: {
        trail: [{ label: moduleLabel, path: listPath }],
      },
    };
  },

  detailNested(trail: readonly ShellBreadcrumbTrailItem[]): {
    shellBreadcrumb: ShellBreadcrumbRouteData;
  } {
    return {
      shellBreadcrumb: { trail },
    };
  },
  list(label: string): { shellBreadcrumb: ShellBreadcrumbRouteData } {
    return { shellBreadcrumb: { trail: [{ label }] } };
  },

  nested(
    parentLabel: string,
    parentPath: string,
    label: string
  ): { shellBreadcrumb: ShellBreadcrumbRouteData } {
    return {
      shellBreadcrumb: {
        trail: [{ label: parentLabel, path: parentPath }, { label }],
      },
    };
  },
};
