import { useState, useEffect, useCallback } from "react";
import { accountApi } from "../api/accountApi";
import type {
  UserPreferencesResponse,
  UpdatePreferencesRequest,
  UserDeviceResponse,
} from "../types/account.types";

export function useSettings() {
  const [preferences, setPreferences] = useState<UserPreferencesResponse | null>(null);
  const [devices, setDevices] = useState<UserDeviceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSettingsData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const [prefData, devData] = await Promise.all([
        accountApi.getPreferences().catch(() => null),
        accountApi.getDevices().catch(() => []),
      ]);
      setPreferences(prefData);
      setDevices(devData || []);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải cài đặt.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const updatePreferences = async (body: UpdatePreferencesRequest) => {
    const updated = await accountApi.updatePreferences(body);
    setPreferences(updated);
    return updated;
  };

  const revokeDevice = async (id: string) => {
    await accountApi.revokeDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  return {
    preferences,
    devices,
    isLoading,
    isError,
    errorMessage,
    refetch: loadSettingsData,
    updatePreferences,
    revokeDevice,
  };
}
