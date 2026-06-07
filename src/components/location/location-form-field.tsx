"use client";

import { useState } from "react";
import {
  LocationField,
  type LocationValue,
} from "@/components/location/location-field";

/**
 * 네이티브 <form action> 안에서 쓰는 위치 입력기.
 * 컨트롤드 LocationField 상태를 hidden input(address/lat/lng)으로 흘려보내
 * 서버 액션이 FormData로 그대로 읽게 한다.
 */
export function LocationFormField({
  initial,
  label,
  addressRequired = false,
  addressError,
  autoLocate = false,
}: {
  initial?: { address: string | null; lat: number | null; lng: number | null };
  label?: string;
  addressRequired?: boolean;
  addressError?: string;
  autoLocate?: boolean;
}) {
  const [value, setValue] = useState<LocationValue>(() => ({
    address: initial?.address ?? "",
    lat: initial?.lat != null ? String(initial.lat) : "",
    lng: initial?.lng != null ? String(initial.lng) : "",
  }));

  return (
    <>
      <LocationField
        value={value}
        onChange={setValue}
        autoLocate={autoLocate}
        label={label}
        addressRequired={addressRequired}
        addressError={addressError}
      />
      <input type="hidden" name="address" value={value.address} readOnly />
      <input type="hidden" name="lat" value={value.lat} readOnly />
      <input type="hidden" name="lng" value={value.lng} readOnly />
    </>
  );
}
