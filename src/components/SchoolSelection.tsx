import { useState, useEffect } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface SchoolOption {
  id: string;
  name: string;
  acronym: string | null;
  emblem_url: string | null;
  city: string | null;
  state: string | null;
}

interface Props {
  onSelect: (schoolId: string, schoolName: string, logoUrl: string | null) => void;
  savedSchoolId?: string | null;
}

export function SchoolSelection({ onSelect, savedSchoolId }: Props) {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [schoolId, setSchoolId] = useState(savedSchoolId ?? "");
  const [schoolsFiltered, setSchoolsFiltered] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Fetch all onboarded states
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("schools")
          .select("state")
          .eq("status", "active")
          .eq("onboarding_complete", true)
          .not("state", "is", null);

        if (error) throw error;

        const uniqueStates = [...new Set(data?.map((s) => s.state).filter(Boolean))] as string[];
        setStates(uniqueStates.sort());
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (!state) {
      setCities([]);
      setCity("");
      setSchoolsFiltered([]);
      return;
    }

    setLoadingCities(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("schools")
          .select("city")
          .eq("status", "active")
          .eq("onboarding_complete", true)
          .eq("state", state)
          .not("city", "is", null);

        if (error) throw error;

        const uniqueCities = [...new Set(data?.map((s) => s.city).filter(Boolean))] as string[];
        setCities(uniqueCities.sort());
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoadingCities(false);
      }
    })();
  }, [state]);

  // Fetch schools when state + city changes
  useEffect(() => {
    if (!state || !city) {
      setSchoolsFiltered([]);
      setSchoolId("");
      return;
    }

    setLoadingSchools(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("schools")
          .select("id, name, acronym, emblem_url, city, state")
          .eq("status", "active")
          .eq("onboarding_complete", true)
          .eq("state", state)
          .eq("city", city)
          .order("name");

        if (error) throw error;

        setSchoolsFiltered(data as SchoolOption[] || []);
      } catch (error) {
        console.error("Error fetching schools:", error);
      } finally {
        setLoadingSchools(false);
      }
    })();
  }, [state, city]);

  const handleStateChange = (v: string) => {
    setState(v);
    setCity("");
    setSchoolId("");
  };

  const handleCityChange = (v: string) => {
    setCity(v);
    setSchoolId("");
  };

  const selectedSchool = schoolsFiltered.find((s) => s.id === schoolId);

  const handleSchoolConfirm = () => {
    if (!schoolId || !selectedSchool) return;
    onSelect(selectedSchool.id, selectedSchool.name, selectedSchool.emblem_url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (states.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No schools onboarded yet. Contact SHARP Support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* State dropdown */}
      <div className="space-y-1.5">
        <Label>State</Label>
        <Select value={state} onValueChange={handleStateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City dropdown */}
      {state && (
        <div className="space-y-1.5">
          <Label>City</Label>
          {loadingCities ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : cities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No schools found in this state.</p>
          ) : (
            <Select value={city} onValueChange={handleCityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* School dropdown */}
      {state && city && (
        <div className="space-y-1.5">
          <Label>School</Label>
          {loadingSchools ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : schoolsFiltered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No schools found in {city}.</p>
          ) : (
            <Select value={schoolId} onValueChange={setSchoolId}>
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {schoolsFiltered.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      {s.emblem_url ? (
                        <img src={s.emblem_url} alt={s.name} loading="lazy" decoding="async" className="h-5 w-5 rounded object-cover shrink-0" />
                      ) : (
                        <Building2 className="h-4 w-4 shrink-0" />
                      )}
                      {s.name}
                      {s.acronym && <span className="text-muted-foreground text-xs">({s.acronym})</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Selected school preview */}
      {schoolId && selectedSchool && (
        <div className="rounded-lg border bg-muted/30 p-4 flex items-center gap-3">
          {selectedSchool.emblem_url ? (
            <img src={selectedSchool.emblem_url} alt={selectedSchool.name} loading="lazy" decoding="async" className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="h-10 w-10 rounded bg-primary/10 grid place-items-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{selectedSchool.name}</p>
            {selectedSchool.city && <p className="text-xs text-muted-foreground">{selectedSchool.city}, {selectedSchool.state}</p>}
          </div>
        </div>
      )}

      {/* Continue button */}
      {schoolId && (
        <Button className="w-full" onClick={handleSchoolConfirm}>
          Continue
        </Button>
      )}
    </div>
  );
}