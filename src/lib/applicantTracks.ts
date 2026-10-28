import type { FutureCraftApplicant, Profile } from "@/lib/api";

export const APPLICANT_TRACKS = [
  { id: "experience-studio", label: "Experience Studio", detail: "Observership" },
  { id: "castle", label: "Castle", detail: "Apprenticeship" },
  { id: "fws", label: "FWS", detail: "Industry" },
] as const;

export type ApplicantTrackId = (typeof APPLICANT_TRACKS)[number]["id"];

export type TrackerApplicant = {
  id: string;
  name: string;
  detail: string;
  college: string;
  podName: string;
  track: ApplicantTrackId;
  appliedAt: string | null;
};

export function applicantTrackMeta(track: ApplicantTrackId) {
  return APPLICANT_TRACKS.find((item) => item.id === track) ?? APPLICANT_TRACKS[0];
}

function appliedTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function looksFor(profile: Profile, optionId: string) {
  return (profile.lookingFor ?? []).includes(optionId);
}

export function buildTrackerApplicants(
  studio: FutureCraftApplicant[],
  industry: Profile[],
): TrackerApplicant[] {
  const rows: TrackerApplicant[] = [
    ...studio.map((applicant) => ({
      id: `studio-${applicant.id}`,
      name: applicant.name || "Unnamed applicant",
      detail: [applicant.email, applicant.year ? `Year ${applicant.year}` : ""].filter(Boolean).join(" · "),
      college: applicant.college || applicant.matchingPodCollegeName || "College not listed",
      podName: applicant.matchingPodName || applicant.matchingPodCollegeName || "",
      track: "experience-studio" as const,
      appliedAt: applicant.createdAt ?? null,
    })),
    ...industry.flatMap((profile) => {
      const base = {
        name: profile.personal?.fullName || "Unnamed applicant",
        detail: profile.personal?.headline || profile.personal?.email || "Industry profile",
        college: profile.personal?.collegeName || "College not listed",
        podName: "",
        appliedAt: profile.submittedAt || profile.createdAt || null,
      };
      const tracks: TrackerApplicant[] = [];
      if (looksFor(profile, "first-experience")) {
        tracks.push({ ...base, id: `castle-${profile.id}`, track: "castle" });
      }
      if (looksFor(profile, "industrial-work") || !looksFor(profile, "first-experience")) {
        tracks.push({ ...base, id: `fws-${profile.id}`, track: "fws" });
      }
      return tracks;
    }),
  ];

  return rows.sort((left, right) => appliedTime(right.appliedAt) - appliedTime(left.appliedAt));
}
