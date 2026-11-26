import { describe, expect, it } from "vitest";
import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";

describe("createCatchAllHandlers", () => {
  const handlers = createCatchAllHandlers([
    {
      pattern: "",
      mod: {
        GET: async () => Response.json({ route: "root" }),
      },
    },
    {
      pattern: "[id]",
      mod: {
        GET: async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
          const { id } = await ctx.params;
          return Response.json({ route: "byId", id });
        },
      },
    },
    {
      pattern: "active",
      mod: {
        GET: async () => Response.json({ route: "active" }),
      },
    },
    {
      pattern: "[id]/actions",
      mod: {
        POST: async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
          const { id } = await ctx.params;
          return Response.json({ route: "actions", id });
        },
      },
    },
  ]);

  it("matches root empty slug", async () => {
    const res = await handlers.GET(new Request("http://localhost/api/v1/battles"), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ route: "root" });
  });

  it("prefers static segment over dynamic [id]", async () => {
    const res = await handlers.GET(new Request("http://localhost/api/v1/battles/active"), {
      params: Promise.resolve({ slug: ["active"] }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ route: "active" });
  });

  it("extracts dynamic params and decodes URI components", async () => {
    const res = await handlers.POST(new Request("http://localhost/api/v1/battles/b%201/actions", { method: "POST" }), {
      params: Promise.resolve({ slug: ["b%201", "actions"] }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ route: "actions", id: "b 1" });
  });

  it("returns 405 with Allow header when method is unsupported", async () => {
    const res = await handlers.POST(new Request("http://localhost/api/v1/battles/active", { method: "POST" }), {
      params: Promise.resolve({ slug: ["active"] }),
    });
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET");
  });

  it("returns 404 when no pattern matches", async () => {
    const res = await handlers.GET(new Request("http://localhost/api/v1/battles/unknown/foo"), {
      params: Promise.resolve({ slug: ["unknown", "foo"] }),
    });
    expect(res.status).toBe(404);
  });
});
