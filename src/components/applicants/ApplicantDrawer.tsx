import { useEffect, useState } from "react";
import { Loader2, Mail, Phone, MapPin, GraduationCap, Linkedin } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Misc";
import { StarRating } from "@/components/ui/StarRating";
import { Profile, ShortlistingCompany, listShortlistingCompanies } from "@/lib/api";
import {
  engagementGigLabels,
  formatWorkPreferences,
  lookingForLabels,
  nanoInfluencerDetails,
  previousExperienceSummary,
  profileRoles,
  profileTools,
  proficiencyLabel,
  skillDomains,
  transferableSkillGroups,
  workPersonalityEntries,
  workPersonalitySummary,
} from "@/lib/applicants";

interface ApplicantDrawerProps {
  profile: Profile | null;
  onClose: () => void;
}

function SkillRatingRow({ name, rating, hint }: { name: string; rating: number; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{name}</p>
        {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      </div>
      <div className="shrink-0 text-right">
        <StarRating value={rating} label={name} size="md" />
        <p className="mt-0.5 text-[10px] text-ink-faint">{proficiencyLabel(rating)}</p>
      </div>
    </div>
  );
}

export default function ApplicantDrawer({ profile, onClose }: ApplicantDrawerProps) {
  const [shortlistingCompanies, setShortlistingCompanies] = useState<ShortlistingCompany[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    listShortlistingCompanies(profile.id)
      .then(setShortlistingCompanies)
      .catch(() => setShortlistingCompanies([]))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  if (!profile) return null;

  const roles = profileRoles(profile);
  const tools = profileTools(profile);
  const technicalDomains = skillDomains(profile);
  const transferableGroups = transferableSkillGroups(profile);
  const personalityEntries = workPersonalityEntries(profile);
  const personalitySummary = workPersonalitySummary(profile);
  const workPrefs = formatWorkPreferences(profile.workPreferences);
  const experienceSummary = previousExperienceSummary(profile);
  const lookingFor = lookingForLabels(profile);
  const engagementGigs = engagementGigLabels(profile);
  const nanoInfluencer = nanoInfluencerDetails(profile);
  const name = profile.personal.fullName || "Unnamed applicant";

  return (
    <Drawer
      open={Boolean(profile)}
      onClose={onClose}
      title={name}
      subtitle={profile.personal.headline || undefined}
      width="w-[640px]"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Avatar name={name} className="h-12 w-12 shrink-0 text-sm" />
          <div className="min-w-0 flex-1">
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {roles.map((role, idx) => (
                  <Badge key={`role-${idx}-${role}`} tone="ruby">{role}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-surface-2 p-3 text-sm sm:grid-cols-2">
          {profile.personal.email && (
            <p className="flex items-center gap-2 text-ink"><Mail className="h-3.5 w-3.5 shrink-0 text-ink-faint" /> {profile.personal.email}</p>
          )}
          {profile.personal.phone && (
            <p className="flex items-center gap-2 text-ink"><Phone className="h-3.5 w-3.5 shrink-0 text-ink-faint" /> {profile.personal.phone}</p>
          )}
          {profile.personal.location && (
            <p className="flex items-center gap-2 text-ink"><MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" /> {profile.personal.location}</p>
          )}
          {profile.personal.collegeName && (
            <p className="flex items-center gap-2 text-ink">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
              {profile.personal.collegeName}{profile.personal.yearOfGraduation ? ` · Class of ${profile.personal.yearOfGraduation}` : ""}
            </p>
          )}
          {profile.personal.linkedin && (
            <a
              href={profile.personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-ruby hover:text-ruby-bright"
            >
              <Linkedin className="h-3.5 w-3.5 shrink-0" /> LinkedIn profile
            </a>
          )}
        </div>

        <div>
          <h3 className="mb-1.5 font-display text-sm font-bold text-ink">Previous experience</h3>
          <p className="text-sm text-ink-muted">{experienceSummary}</p>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Looking for right now</h3>
          {lookingFor.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {lookingFor.map((label) => (
                <Badge key={label} tone="info">{label}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Not provided</p>
          )}
        </div>

        {technicalDomains.length > 0 && (
          <div>
            <h3 className="mb-3 font-display text-sm font-bold text-ink">Technical skills</h3>
            <div className="space-y-4">
              {technicalDomains.map(({ domain, skills }) => (
                <div key={domain}>
                  {technicalDomains.length > 1 && (
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-faint">{domain}</p>
                  )}
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <SkillRatingRow
                        key={skill.id}
                        name={skill.name}
                        rating={skill.proficiency}
                        hint={skill.domain && technicalDomains.length === 1 ? skill.domain : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {transferableGroups.length > 0 && (
          <div>
            <h3 className="mb-3 font-display text-sm font-bold text-ink">Transferable skills</h3>
            <div className="space-y-4">
              {transferableGroups.map((group) => (
                <div key={group.category}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-faint">{group.category}</p>
                  <div className="space-y-2">
                    {group.skills.map((skill) => (
                      <SkillRatingRow key={skill.name} name={skill.name} rating={skill.rating} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tools.length > 0 && (
          <div>
            <h3 className="mb-3 font-display text-sm font-bold text-ink">Tools</h3>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool, idx) => (
                <Badge key={`tool-${idx}-${tool}`} tone="amber">{tool}</Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Engagement gigs</h3>
          {engagementGigs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {engagementGigs.map((label) => (
                <Badge key={label} tone="muted">{label}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Not provided</p>
          )}
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Creator work</h3>
          {nanoInfluencer ? (
            <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm">
              <p className="font-medium text-ink">Signed up as a nano-influencer</p>
              {nanoInfluencer.instagramHandle ? (
                <p className="mt-1 text-ink-muted">Instagram: {nanoInfluencer.instagramHandle}</p>
              ) : null}
              {nanoInfluencer.followers ? (
                <p className="mt-0.5 text-ink-muted">{nanoInfluencer.followers} followers</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Not signed up</p>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-display text-sm font-bold text-ink">Work personality</h3>
            {personalityEntries.length > 0 ? (
              <div className="text-right">
                <StarRating value={personalitySummary.rounded} label="Work personality" size="md" />
                <p className="mt-0.5 text-[10px] text-ink-faint">
                  {personalitySummary.label}{personalitySummary.average ? ` · ${personalitySummary.average}/5` : ""}
                </p>
              </div>
            ) : null}
          </div>
          {personalityEntries.length > 0 ? (
            <div className="space-y-2">
              {personalityEntries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                  <p className="mb-1.5 text-sm text-ink-muted">{entry.text}</p>
                  <StarRating value={entry.rating} label={entry.text} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Not rated yet</p>
          )}
        </div>

        {workPrefs.length > 0 && (
          <div>
            <h3 className="mb-3 font-display text-sm font-bold text-ink">Work preferences</h3>
            <div className="space-y-3">
              {workPrefs.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-xs uppercase tracking-wide text-ink-faint">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.values.map((value) => (
                      <Badge key={`${group.label}-${value}`} tone="info">{value}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-line pt-4">
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Shortlisted by</h3>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />
            </div>
          ) : shortlistingCompanies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {shortlistingCompanies.map((company) => (
                <Badge key={company.id} tone="good">{company.name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Not shortlisted yet</p>
          )}
        </div>

        {profile.submittedAt && (
          <div className="border-t border-line pt-4 text-xs text-ink-muted">
            Submitted{" "}
            {new Date(profile.submittedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
