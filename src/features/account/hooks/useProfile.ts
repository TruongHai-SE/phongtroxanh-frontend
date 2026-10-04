import { useState, useEffect, useCallback } from "react";
import { accountApi } from "../api/accountApi";
import type { UserProfileResponse, UpdateProfileRequest } from "../types/account.types";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      const data = await accountApi.getProfile();
      setProfile(data);
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || "Không thể tải thông tin hồ sơ.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (body: UpdateProfileRequest) => {
    try {
      const updated = await accountApi.updateProfile(body);
      setProfile(updated);
      return updated;
    } catch (err: any) {
      throw err;
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const res = await accountApi.uploadAvatar(file);
      if (profile) {
        setProfile({ ...profile, avatarUrl: res.avatarUrl });
      }
      return res.avatarUrl;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    profile,
    isLoading,
    isError,
    errorMessage,
    refetch: fetchProfile,
    updateProfile,
    uploadAvatar,
  };
}
