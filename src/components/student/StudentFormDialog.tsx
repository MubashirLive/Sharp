"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { studentTab1Schema, studentTab2Schema, studentTab3Schema, studentTab4Schema, studentTab5Schema, studentTab6Schema, studentTab7Schema, studentTab8Schema, studentTab9Schema, studentTab10Schema } from "@/lib/schemas";

import { Tab1Identity } from "./tabs/Tab1Identity";
import { Tab3PersonalProfile } from "./tabs/Tab3PersonalProfile";

interface StudentFormDialogProps {
  open: boolean;
  onClose: () => void;
}

type TabIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export function StudentFormDialog({ open, onClose }: StudentFormDialogProps) {
  const { schoolId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabIndex>(1);
  const [form, setForm] = useState<Partial<z.infer<typeof studentTab1Schema>>>({
    first_name: "",
    middle_name: "",
    last_name: "",
    father_first_name: "",
    father_middle_name: "",
    father_last_name: "",
    gender: "Male",
    login_mobile: "",
    class_id: "",
    section_id: "",
    house_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tab completion status
  const [tabStatus, setTabStatus] = useState<Record<TabIndex, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
  });

  // Generate student ID on Tab 1 save
  const handleSaveTab1 = async () => {
    const result = studentTab1Schema.safeParse(form);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    // Reserve student ID
    const { data: reservation } = await supabase
      .rpc("reserve_student_id", {
        p_school_id: schoolId,
        p_academic_year: "26", // TODO: Get from current session
        p_count: 1,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
      });

    if (reservation && reservation.length > 0) {
      // Store reservation ID
      // setActiveTab(2); // Unlock next tab
    }
  };

  // Handle form field changes
  const handleFieldChange = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Render active tab
  const renderTab = () => {
    switch (activeTab) {
      case 1:
        return (
          <Tab1Identity
            form={form}
            onChange={handleFieldChange}
            errors={errors}
            disabled={tabStatus[1] === false}
          />
        );
      case 2:
        return <div>Photo & Family Tab - To be implemented</div>;
      case 3:
        return (
          <Tab3PersonalProfile
            form={form}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      default:
        return <div>Other tabs - To be implemented</div>;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Add Student</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Profile Completion</span>
              <span>0%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 1, name: "Identity", locked: tabStatus[1] === false },
              { id: 2, name: "Photo & Family", locked: tabStatus[1] === false },
              { id: 3, name: "Personal Profile", locked: tabStatus[1] === false },
              { id: 4, name: "Address & Location", locked: tabStatus[1] === false },
              { id: 5, name: "Academic & House", locked: tabStatus[1] === false },
              { id: 6, name: "Family Extended", locked: tabStatus[1] === false },
              { id: 7, name: "Operational", locked: tabStatus[1] === false },
              { id: 8, name: "Government IDs", locked: tabStatus[1] === false },
              { id: 9, name: "Bank Details", locked: tabStatus[1] === false },
              { id: 10, name: "Medical & Disability", locked: tabStatus[1] === false },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.locked ? null : setActiveTab(tab.id as TabIndex)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : tab.locked
                    ? "text-gray-400 cursor-not-allowed"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                disabled={tab.locked}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTab()}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={activeTab === 1 ? handleSaveTab1 : () => setActiveTab(activeTab + 1)}
            disabled={activeTab === 1 && Object.keys(errors).length > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {activeTab === 1 ? "Save & Continue" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}