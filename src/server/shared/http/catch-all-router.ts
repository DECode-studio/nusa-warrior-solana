export interface CatchAllContext {
  params: Promise<{ slug?: string[] }>;
}

export type RouteHandlerFn = (
  request: Request,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export type RouteModule = Record<string, unknown>;

export interface RouteEntry {
  /** Path pattern relative to the catch-all root, e.g. "", "login", "[id]/actions". */
  pattern: string;
  mod: RouteModule;
}

interface CompiledRoute {
  segments: string[];
  staticCount: number;
  mod: RouteModule;
}

function compileRoutes(entries: RouteEntry[]): CompiledRoute[] {
  return entries
    .map((entry) => {
      const segments = entry.pattern === "" ? [] : entry.pattern.split("/");
      const staticCount = segments.filter((s) => !(s.startsWith("[") && s.endsWith("]"))).length;
      return { segments, staticCount, mod: entry.mod };
    })
    .sort((a, b) => {
      if (a.segments.length !== b.segments.length) {
        return a.segments.length - b.segments.length;
      }
      return b.staticCount - a.staticCount;
    });
}

function matchRoute(
  compiled: CompiledRoute[],
  slug: string[]
): { mod: RouteModule; params: Record<string, string> } | null {
  for (const route of compiled) {
    if (route.segments.length !== slug.length) {
      continue;
    }

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < route.segments.length; i++) {
      const expected = route.segments[i];
      const actual = slug[i];

      if (expected.startsWith("[") && expected.endsWith("]")) {
        const paramName = expected.slice(1, -1);
        params[paramName] = decodeURIComponent(actual);
      } else if (expected !== actual) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return { mod: route.mod, params };
    }
  }

  return null;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;

/**
 * Creates Next.js App Router HTTP method exports backed by a single catch-all
 * dispatcher, allowing multiple endpoint modules to share one Serverless Function.
 */
export function createCatchAllHandlers(entries: RouteEntry[]) {
  const compiled = compileRoutes(entries);

  async function dispatch(request: Request, context: CatchAllContext): Promise<Response> {
    const resolved = await context.params;
    const slug = resolved.slug ?? [];
    const match = matchRoute(compiled, slug);

    if (!match) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Not Found" } },
        { status: 404 }
      );
    }

    const handler = match.mod[request.method];
    if (typeof handler !== "function") {
      const allowed = HTTP_METHODS.filter((m) => typeof match.mod[m] === "function");
      return new Response(null, {
        status: 405,
        headers: allowed.length > 0 ? { Allow: allowed.join(", ") } : undefined,
      });
    }

    return (handler as RouteHandlerFn)(request, {
      params: Promise.resolve(match.params),
    });
  }

  return {
    GET: dispatch,
    POST: dispatch,
    PUT: dispatch,
    PATCH: dispatch,
    DELETE: dispatch,
  };
}
