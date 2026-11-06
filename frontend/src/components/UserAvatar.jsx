import { useState } from "react";
import {
  getDisplayName,
  getInitialsFromName,
  getPhotoUrl,
} from "../utils/user";

/**
 * Round avatar — photo when available, initials otherwise (also if the
 * image fails to load). Pass a `user` object (the Redux auth user) or a
 * plain `name` / `src` (e.g. an instructor). `tone` sets the initials
 * background + text colours.
 */
export default function UserAvatar({
  user,
  name,
  src,
  size = 40,
  tone = "bg-secondary text-white",
  className = "",
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const label = name ?? getDisplayName(user);
  const photo = src ?? getPhotoUrl(user);
  const showPhoto = photo && photo !== failedSrc;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${tone} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {showPhoto ? (
        <img
          src={photo}
          alt=""
          onError={() => setFailedSrc(photo)}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitialsFromName(label)
      )}
    </span>
  );
}
