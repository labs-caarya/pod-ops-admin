import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  listColleges,
  listFutureCraftApplicants,
  listIndustryApplicants,
  listLeaderGoals,
  listMentors,
  listManagedUsers,
  getAdminDashboard,
  listPodPortfolio,
  listNetworkPartners,
  listPartnerships,
  listTalentMembers,
  listResearchProfiles,
  listRelationshipCompanies,
  listRolodexContacts,
  listOpportunities,
  listPlacementOffers,
  listMarketingCampaigns,
  listContentCalendar,
  listPodComments,
  listPodCommentUnreadCounts,
  listPodSuccessMeetings,
  listChallenges,
  listPodActivationData,
  listKnowledgeResources,
  getKnowledgeResourceOptions,
  listAdminContent,
  getAdminContentOptions,
  listAdminAudiences,
  listAdminEvents,
  listProgramTodos,
  listCrewLeadReports,
  type College,
  type FutureCraftApplicant,
  type Profile,
  type AllowedUser,
  type AdminDashboardData,
  type PodPortfolioEntry,
  type NetworkPartner,
  type MarketingCalendarCampaign,
  type ContentCalendarItem,
  type PodComment,
  type PodCommentUnreadCount,
  type PodSuccessMeeting,
  type PodActivationData,
  type CrewLeadReport,
} from "@/lib/api";
import type { KnowledgeResource, KnowledgeResourceOptions } from "@/lib/knowledgeSpace/types";
import type { ContentItem } from "@/lib/content";
import type { ContentDirectoryOptions } from "@/lib/content";
import type { Audience } from "@/lib/audiences";
import type { AdminEvent } from "@/lib/events";
import type { ProgramTodo } from "@/lib/programTodos";
import type { Challenge, PodLeaderGoal, PodMentor } from "@/lib/types";

const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const adminQueryKeys = {
  colleges: ["admin", "colleges"] as const,
  managedUsers: ["admin", "managed-users"] as const,
  futureCraftApplicants: ["admin", "future-craft-applicants"] as const,
  industryApplicants: ["admin", "industry-applicants"] as const,
  leaderGoals: ["admin", "leader-goals"] as const,
  mentors: ["admin", "mentors"] as const,
  dashboard: ["admin", "dashboard"] as const,
  podPortfolio: ["admin", "pod-portfolio"] as const,
  networkPartners: ["admin", "network-partners"] as const,
  partnerships: ["admin", "partnerships"] as const,
  talentMembers: ["admin", "talent-members"] as const,
  researchProfiles: ["admin", "research-profiles"] as const,
  relationshipCompanies: ["admin", "relationship-companies"] as const,
  rolodexContacts: ["admin", "rolodex-contacts"] as const,
  opportunities: ["admin", "opportunities"] as const,
  placementOffers: ["admin", "placement-offers"] as const,
  marketingCampaigns: ["admin", "marketing-campaigns"] as const,
  contentCalendar: ["admin", "content-calendar"] as const,
  podComments: (collegeId: string) => ["admin", "pod-comments", collegeId] as const,
  podCommentUnreadCounts: ["admin", "pod-comment-unread-counts"] as const,
  podSuccessMeetings: (collegeId: string) => ["admin", "pod-success-meetings", collegeId] as const,
  challenges: ["admin", "challenges"] as const,
  podActivation: ["admin", "pod-activation"] as const,
  knowledgeResources: ["admin", "knowledge-resources"] as const,
  knowledgeResourceOptions: ["admin", "knowledge-resource-options"] as const,
  content: ["admin", "content"] as const,
  contentOptions: ["admin", "content-options"] as const,
  audiences: ["admin", "audiences"] as const,
  events: ["admin", "events"] as const,
  programTodos: ["admin", "program-todos"] as const,
  crewLeadReports: ["admin", "crew-lead-reports"] as const,
};

export function collegesQueryOptions() {
  return queryOptions<College[]>({
    queryKey: adminQueryKeys.colleges,
    queryFn: listColleges,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function dashboardQueryOptions() {
  return queryOptions<AdminDashboardData>({
    queryKey: adminQueryKeys.dashboard,
    queryFn: getAdminDashboard,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function crewLeadReportsQueryOptions() {
  return queryOptions<CrewLeadReport[]>({
    queryKey: adminQueryKeys.crewLeadReports,
    queryFn: listCrewLeadReports,
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function podPortfolioQueryOptions() {
  return queryOptions<PodPortfolioEntry[]>({
    queryKey: adminQueryKeys.podPortfolio,
    queryFn: listPodPortfolio,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function networkPartnersQueryOptions() {
  return queryOptions<NetworkPartner[]>({
    queryKey: adminQueryKeys.networkPartners,
    queryFn: listNetworkPartners,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function partnershipsQueryOptions() {
  return queryOptions<import("@/lib/types").Partner[]>({
    queryKey: adminQueryKeys.partnerships,
    queryFn: listPartnerships,
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function talentMembersQueryOptions() {
  return queryOptions<import("@/lib/types").TalentMember[]>({
    queryKey: adminQueryKeys.talentMembers,
    queryFn: listTalentMembers,
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function researchProfilesQueryOptions() {
  return queryOptions<import("@/lib/types").ResearchProfile[]>({ queryKey: adminQueryKeys.researchProfiles, queryFn: listResearchProfiles, staleTime: 30_000, gcTime: THIRTY_MINUTES });
}

export function relationshipCompaniesQueryOptions() {
  return queryOptions<import("@/lib/api").RelationshipCompany[]>({ queryKey: adminQueryKeys.relationshipCompanies, queryFn: listRelationshipCompanies, staleTime: 30_000, gcTime: THIRTY_MINUTES });
}

export function rolodexContactsQueryOptions() {
  return queryOptions<import("@/lib/types").Contact[]>({ queryKey: adminQueryKeys.rolodexContacts, queryFn: listRolodexContacts, staleTime: 30_000, gcTime: THIRTY_MINUTES });
}

export function opportunitiesQueryOptions() {
  return queryOptions<import("@/lib/types").JobOpportunity[]>({ queryKey: adminQueryKeys.opportunities, queryFn: listOpportunities, staleTime: 30_000, gcTime: THIRTY_MINUTES });
}

export function placementOffersQueryOptions() {
  return queryOptions<import("@/lib/types").PlacementOffer[]>({ queryKey: adminQueryKeys.placementOffers, queryFn: listPlacementOffers, staleTime: 30_000, gcTime: THIRTY_MINUTES });
}

export function marketingCampaignsQueryOptions() {
  return queryOptions<MarketingCalendarCampaign[]>({
    queryKey: adminQueryKeys.marketingCampaigns,
    queryFn: listMarketingCampaigns,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function contentCalendarQueryOptions() {
  return queryOptions<ContentCalendarItem[]>({
    queryKey: adminQueryKeys.contentCalendar,
    queryFn: listContentCalendar,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function podCommentsQueryOptions(collegeId: string) {
  return queryOptions<PodComment[]>({
    queryKey: adminQueryKeys.podComments(collegeId),
    queryFn: () => listPodComments(collegeId),
    enabled: Boolean(collegeId),
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function podSuccessMeetingsQueryOptions(collegeId: string) {
  return queryOptions<PodSuccessMeeting[]>({
    queryKey: adminQueryKeys.podSuccessMeetings(collegeId),
    queryFn: () => listPodSuccessMeetings(collegeId),
    enabled: Boolean(collegeId),
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function podCommentUnreadCountsQueryOptions() {
  return queryOptions<PodCommentUnreadCount[]>({
    queryKey: adminQueryKeys.podCommentUnreadCounts,
    queryFn: listPodCommentUnreadCounts,
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function challengesQueryOptions() {
  return queryOptions<Challenge[]>({
    queryKey: adminQueryKeys.challenges,
    queryFn: listChallenges,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function podActivationQueryOptions() {
  return queryOptions<PodActivationData>({
    queryKey: adminQueryKeys.podActivation,
    queryFn: listPodActivationData,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function knowledgeResourcesQueryOptions() {
  return queryOptions<KnowledgeResource[]>({
    queryKey: adminQueryKeys.knowledgeResources,
    queryFn: listKnowledgeResources,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function knowledgeResourceOptionsQueryOptions() {
  return queryOptions<KnowledgeResourceOptions>({
    queryKey: adminQueryKeys.knowledgeResourceOptions,
    queryFn: getKnowledgeResourceOptions,
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function adminContentQueryOptions() {
  return queryOptions<ContentItem[]>({
    queryKey: adminQueryKeys.content,
    queryFn: listAdminContent,
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function adminContentOptionsQueryOptions() {
  return queryOptions<ContentDirectoryOptions>({
    queryKey: adminQueryKeys.contentOptions,
    queryFn: getAdminContentOptions,
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function adminAudiencesQueryOptions() {
  return queryOptions<Audience[]>({ queryKey: adminQueryKeys.audiences, queryFn: listAdminAudiences, staleTime: 30_000, gcTime: THIRTY_MINUTES });
}

export function adminEventsQueryOptions() { return queryOptions<AdminEvent[]>({ queryKey: adminQueryKeys.events, queryFn: listAdminEvents, staleTime: 30_000, gcTime: THIRTY_MINUTES }); }

export function programTodosQueryOptions(programId: string) {
  return queryOptions<ProgramTodo[]>({
    queryKey: [...adminQueryKeys.programTodos, programId],
    queryFn: () => listProgramTodos(programId),
    staleTime: 30_000,
    gcTime: THIRTY_MINUTES,
  });
}

export function managedUsersQueryOptions() {
  return queryOptions<AllowedUser[]>({
    queryKey: adminQueryKeys.managedUsers,
    queryFn: listManagedUsers,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function futureCraftApplicantsQueryOptions() {
  return queryOptions<FutureCraftApplicant[]>({
    queryKey: adminQueryKeys.futureCraftApplicants,
    queryFn: listFutureCraftApplicants,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function industryApplicantsQueryOptions() {
  return queryOptions<Profile[]>({
    queryKey: adminQueryKeys.industryApplicants,
    queryFn: listIndustryApplicants,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function leaderGoalsQueryOptions() {
  return queryOptions<PodLeaderGoal[]>({
    queryKey: adminQueryKeys.leaderGoals,
    queryFn: listLeaderGoals,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function mentorsQueryOptions() {
  return queryOptions<PodMentor[]>({
    queryKey: adminQueryKeys.mentors,
    queryFn: listMentors,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });
}

export function warmAdminWorkspaceCache(queryClient: QueryClient) {
  return Promise.allSettled([
    queryClient.prefetchQuery(collegesQueryOptions()),
    queryClient.prefetchQuery(managedUsersQueryOptions()),
    queryClient.prefetchQuery(futureCraftApplicantsQueryOptions()),
    queryClient.prefetchQuery(industryApplicantsQueryOptions()),
    queryClient.prefetchQuery(leaderGoalsQueryOptions()),
    queryClient.prefetchQuery(mentorsQueryOptions()),
    queryClient.prefetchQuery(dashboardQueryOptions()),
    queryClient.prefetchQuery(podPortfolioQueryOptions()),
    queryClient.prefetchQuery(networkPartnersQueryOptions()),
    queryClient.prefetchQuery(marketingCampaignsQueryOptions()),
    queryClient.prefetchQuery(contentCalendarQueryOptions()),
    queryClient.prefetchQuery(challengesQueryOptions()),
    queryClient.prefetchQuery(podActivationQueryOptions()),
    queryClient.prefetchQuery(knowledgeResourcesQueryOptions()),
    queryClient.prefetchQuery(knowledgeResourceOptionsQueryOptions()),
    queryClient.prefetchQuery(adminContentQueryOptions()),
    queryClient.prefetchQuery(adminEventsQueryOptions()),
    queryClient.prefetchQuery(programTodosQueryOptions("experience-studio")),
  ]);
}
