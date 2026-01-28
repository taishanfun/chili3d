const parseBool = (value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "boolean") return value;
    const v = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(v)) return true;
    if (["0", "false", "no", "n", "off"].includes(v)) return false;
    return undefined;
};

const mergeConfig = (base, next) => {
    return {
        ...base,
        ...(next && typeof next === "object" ? next : {}),
        sidebar: {
            ...(base?.sidebar ?? {}),
            ...(next?.sidebar && typeof next.sidebar === "object" ? next.sidebar : {}),
        },
        ribbon: {
            ...(base?.ribbon ?? {}),
            ...(next?.ribbon && typeof next.ribbon === "object" ? next.ribbon : {}),
        },
    };
};

export const defaultUiConfig = {
    sidebar: { visible: true },
    ribbon: { visible: true },
};

export const loadUiConfig = async () => {
    const searchParams = new URLSearchParams(window.location.search || "");
    const configUrl = searchParams.get("uiConfigUrl") || "/ui-config.json";
    const profile = searchParams.get("uiProfile");

    let config = defaultUiConfig;
    try {
        const res = await fetch(configUrl, { cache: "no-store" });
        if (res.ok) {
            const json = await res.json();
            config = mergeConfig(defaultUiConfig, json);

            if (profile) {
                const profileConfig = json?.profiles?.[profile];
                config = mergeConfig(config, profileConfig);
            }
        }
    } catch {
        config = defaultUiConfig;
    }

    const sidebarVisibleEnv = parseBool(import.meta.env.VITE_UI_SIDEBAR_VISIBLE);
    if (sidebarVisibleEnv !== undefined) config.sidebar.visible = sidebarVisibleEnv;

    const ribbonVisibleEnv = parseBool(import.meta.env.VITE_UI_RIBBON_VISIBLE);
    if (ribbonVisibleEnv !== undefined) config.ribbon.visible = ribbonVisibleEnv;

    const sidebarVisibleQuery =
        parseBool(searchParams.get("ui.sidebar")) ??
        parseBool(searchParams.get("ui.sidebar.visible")) ??
        parseBool(searchParams.get("uiSidebarVisible"));
    if (sidebarVisibleQuery !== undefined) config.sidebar.visible = sidebarVisibleQuery;

    const ribbonVisibleQuery =
        parseBool(searchParams.get("ui.ribbon")) ??
        parseBool(searchParams.get("ui.ribbon.visible")) ??
        parseBool(searchParams.get("uiRibbonVisible"));
    if (ribbonVisibleQuery !== undefined) config.ribbon.visible = ribbonVisibleQuery;

    return config;
};
