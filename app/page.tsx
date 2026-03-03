"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["hello"],
    queryFn: async () => {
      const res = await fetch("/api/hello");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="p-10 space-y-4">
      <Button onClick={() => toast.success("Success!")}>Show Toast</Button>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
