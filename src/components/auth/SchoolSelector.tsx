import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { AUTH_STORAGE_KEYS } from "@/lib/auth-constants";

interface SchoolSelectorProps {
  onComplete: (schoolId: string, schoolName: string, emblemUrl: string | null) => void;
}

interface SchoolOption {
  id: string;
  name: string;
  emblem_url: string | null;
}

export function SchoolSelector({ onComplete }: SchoolSelectorProps) {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("state")
        .eq("status", "active")
        .not("state", "is", null)
        .order("state", { ascending: true });

      if (error) throw error;

      const uniqueStates = [...new Set(data?.map((s) => s.state).filter(Boolean))] as string[];
      setStates(uniqueStates);
    } catch (error) {
      console.error("Error fetching states:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (state: string) => {
    setLoadingCities(true);
    setCities([]);
    setSelectedCity("");
    setSchools([]);
    setSelectedSchool("");

    try {
      const { data, error } = await supabase
        .from("schools")
        .select("city")
        .eq("status", "active")
        .eq("state", state)
        .not("city", "is", null)
        .order("city", { ascending: true });

      if (error) throw error;

      const uniqueCities = [...new Set(data?.map((s) => s.city).filter(Boolean))] as string[];
      setCities(uniqueCities);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchSchools = async (state: string, city: string) => {
    setLoadingSchools(true);
    setSchools([]);
    setSelectedSchool("");

    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, emblem_url")
        .eq("status", "active")
        .eq("state", state)
        .eq("city", city)
        .order("name", { ascending: true });

      if (error) throw error;

      setSchools(data || []);
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    fetchCities(state);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    fetchSchools(selectedState, city);
  };

  const handleContinue = () => {
    const school = schools.find((s) => s.id === selectedSchool);
    if (school) {
      // Save to localStorage
      localStorage.setItem(AUTH_STORAGE_KEYS.SCHOOL_ID, school.id);
      localStorage.setItem(AUTH_STORAGE_KEYS.SCHOOL_NAME, school.name);
      localStorage.setItem(AUTH_STORAGE_KEYS.SCHOOL_LOGO, school.emblem_url || "");
      onComplete(school.id, school.name, school.emblem_url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (states.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No schools onboarded yet. Contact SHARP Support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select State</label>
        <Select value={selectedState} onValueChange={handleStateChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedState && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Select City</label>
          {loadingCities ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : cities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schools found in this state.</p>
          ) : (
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {selectedState && selectedCity && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Select School</label>
          {loadingSchools ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : schools.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schools found in {selectedCity}.</p>
          ) : (
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    <div className="flex items-center gap-2">
                      {school.emblem_url && (
                        <img
                          src={school.emblem_url}
                          alt=""
                          className="h-6 w-6 rounded object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <span>{school.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {selectedSchool && (
        <Button
          onClick={handleContinue}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
      )}
    </div>
  );
}