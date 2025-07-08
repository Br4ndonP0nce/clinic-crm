// src/app/admin/patients/new/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import NewPatientForm from "@/components/dental/newPatientForm";

export default function NewPatientPage() {
  return (
    <ProtectedRoute requiredPermissions={["patients:write"]}>
      <div className="min-h-screen bg-gray-50">
        <NewPatientForm />
      </div>
    </ProtectedRoute>
  );
}
