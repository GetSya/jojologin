"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      router.replace("/");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      localStorage.setItem("jojo_token", token);
      localStorage.setItem(
        "jojo_user",
        JSON.stringify({
          username: payload.username,
          whatsapp: payload.whatsapp || "",
          email: payload.email || "",
          role: "user",
        })
      );
      router.replace(payload.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      router.replace("/");
    }
  }, [params, router]);

  return (
    <div className="page">
      <div className="wrap">
        <div className="cardbox">Menyelesaikan login Google...</div>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="page"><div className="wrap"><div className="cardbox">Memuat...</div></div></div>}>
      <SuccessInner />
    </Suspense>
  );
}
