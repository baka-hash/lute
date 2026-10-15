import Home from "@/components/Home";
import type { BlogVariant } from "@/components/sections/Blog";

// v2 options for the client: ?blog=1 (slider, default) or ?blog=2 (hover)
export default async function Page({ searchParams }: { searchParams: Promise<{ blog?: string }> }) {
  const { blog } = await searchParams;
  const blogVariant: BlogVariant = blog === "2" ? "hover" : "slider";
  return <Home blogVariant={blogVariant} />;
}
