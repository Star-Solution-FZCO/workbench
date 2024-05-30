import { ContactTypeT, SelectOptionT } from "types";
import { DayOfWeekT, DayT } from "./index";

export type Override<T1, T2> = Omit<T1, keyof T2> & T2;

export type PhoneModelT = {
    phone: string;
    description: string;
    type: "work" | "home" | "mobile";
};

export type ProfileModelT = {
    id: number;
    account: string;
    english_name: string;
    email: string;
    photo: string | null;
    hr: boolean;
    admin: boolean;
    timezone?: string;
    roles?: string[];
};

export type UserInfoT = {
    id: number;
    english_name: string;
    pararam: string | null;
};

export type NewLocationT = {
    readonly zip: string;
    readonly type: "office" | "home";
    readonly city: string;
    readonly country: string;
    readonly address: string;
    readonly phones: PhoneModelT[];
    readonly description: string;
    readonly ip: string[];
};

export type EmployeeFormLocation = {
    readonly selected?: SelectOptionT;
    readonly zip: string;
    readonly type: "office" | "home";
    readonly city: string;
    readonly country: string;
    readonly address: string;
    readonly phones: PhoneModelT[];
    readonly description: string;
};

export type LocationT = NewLocationT & {
    readonly id: number;
    readonly updated: string;
    readonly certifications: {
        valid: boolean;
        comment: string;
        inspector: UserInfoT;
        created: string;
    }[];
};

export type NewTeamT = {
    name: string;
    key: string;
    description: string;
    manager: EmployeeSelectOptionT;
    head_team: SelectOptionT | null;
    tags: SelectOptionT[];
};

export type UpdateTeamT = {
    id: number;
    name?: string;
    key?: string;
    description?: string;
    manager?: EmployeeSelectOptionT;
    head_team?: SelectOptionT | null;
    tags?: SelectOptionT[];
};

export type TeamT = {
    id: number;
    name: string;
    key: string;
    description: string;
    manager: EmployeeSelectOptionT | null;
    tags: Array<SelectTagOptionT>;
    head_team: SelectOptionT | null;
    sub_teams: SelectOptionT[];
    is_archived: boolean;
    is_current_user_member: boolean;
};

export type TeamHistoryRecordT = {
    action: string;
    user: UserInfoT | null;
    time: string;
    name: string | null;
};

export type EmployeeSelectOptionT = SelectOptionT & {
    photo?: string;
    pararam?: string;
};

export type NewGradeT = {
    name: string;
    description: string;
};

export type UpdateGradeT = {
    id: number;
    description?: string;
};

export type GradeT = NewGradeT & {
    id: number;
};

export type NewOrganizationT = {
    name: string;
    description: string;
};

export type OrganizationT = NewOrganizationT & {
    id: number;
    is_archived: boolean;
};

export type NewPositionT = {
    name: string;
    description: string;
    category: SelectOptionT | null;
};

export type PositionT = NewPositionT & {
    id: number;
    is_archived: boolean;
};

export type EmployeeOrganizationT = {
    organization: SelectOptionT;
    cooperation_type: SelectOptionT;
    contract_date: string;
};

export type TimeRangeT = {
    start: string;
    end: string;
};

export type GradeWithReasonT = {
    grade: string;
    reason: string;
    readonly updated: string;
};

export type EmployeeT = {
    id: number;
    about: string | null;
    account: string;
    active: boolean;
    availability_time: TimeRangeT | null;
    birthday: [number, number] | string | null;
    contract_date?: string | null;
    cooperation_type?: SelectOptionT | null;
    email: string;
    english_name: string;
    grade?: GradeWithReasonT;
    is_current_user_manager: boolean;
    is_current_user_mentor: boolean;
    is_current_user_team_lead: boolean;
    is_current_user_watch: boolean;
    managers: EmployeeSelectOptionT[];
    mentors: EmployeeSelectOptionT[];
    native_name: string | null;
    organization?: SelectOptionT;
    otp_restore?: string[] | null;
    pararam: string | null;
    photo: string | null;
    position: SelectOptionT | null;
    projects: string[];
    public_contacts: string | null;
    roles?: SelectOptionT[];
    skills: string[];
    team: SelectOptionT | null;
    team_position: string | null;
    timezone: SelectOptionT | null;
    work_ended: string | null;
    work_notifications_chats?: number[];
    work_started: string;
    created: string;
    probation_period_started?: string | null;
    probation_period_ended?: string | null;
    probation_period_justification?: string | null;
    dismissal_reason?: string;
    today_schedule_status: DayT;
    pool: SelectOptionT | null;
    linked_accounts: EmployeeLinkedAccountT[];
};

export type NewEmployeeT = {
    account: string;
    english_name: string;
    native_name: string | null;
    email: string;
    work_started: string | null;
    managers: EmployeeSelectOptionT[];
    mentors: EmployeeSelectOptionT[];
    position: string | null;
    team: SelectOptionT | null;
    team_position: string | null;
    birthday: string | null;
    active: boolean;
    roles: SelectOptionT[];
    pararam: string | null;
    pool?: SelectOptionT | null;
    holiday_set?: SelectOptionT | null;
};

export type CreateEmployeeT = Override<
    NewEmployeeT,
    { about: string; photo: string | null }
>;

export type UpdateEmployeeT = Partial<EmployeeT>;

export type NewOnboardingData = {
    start: Date | string;
    end: Date | string;
    summary: string;
    description: string;
    contacts: string;
    work_mode: string;
    comment: string;
    organization: string | SelectOptionT;
};

export type OnboardingData = NewOnboardingData & {
    google_calendar_event_id?: string;
    google_calendar_event_link?: string;
    calendar_events?: { id: string; link: string }[];
    youtrack_issue_id?: string;
    contacts?: string;
    work_mode?: string;
    comment?: string;
    organization?: string | SelectOptionT;
};

export type DismissAdminEmployeeT = {
    id: number;
};

export type RequestTypeT =
    | "ADD_EMPLOYEE"
    | "PERMISSIONS"
    | "SOFTWARE"
    | "HARDWARE"
    | "DISMISS_EMPLOYEE"
    | "JOIN_TEAM";

export type RequestStatusT = "NEW" | "CLOSED" | "APPROVED";

export type RequestT = {
    id: number;
    type: RequestTypeT;
    created_by: EmployeeSelectOptionT;
    closed_by: EmployeeSelectOptionT | null;
    created: string;
    updated: string;
    subject: string;
    metadata?: {
        youtrack: string;
    };
    status: RequestStatusT;
    can_cancel: boolean;
    can_approve: boolean;
    data: any;
};

export type RequestModelT<T> = RequestT & {
    data: T;
};

export type EmployeeRequestT = {
    native_name: string | null;
    english_name: string;
    grade: string | null;
    team: null;
    position: string | null;
    organization: null;
    email: string;
    photo: string | null;
    phones: PhoneModelT[];
    managers: EmployeeSelectOptionT[];
    mentors: EmployeeSelectOptionT[];
    projects: SelectOptionT[];
    locations: LocationT[];
    hardware: string;
    software: string;
    permissions: string;
    about: string;
    birthday: string | null;
};

export type DismissRequestT = {
    date: string;
    employee: EmployeeSelectOptionT;
};

export type DismissRequestFormDataT = { date: string };

export type EmployeeHistoryRecordT = {
    audit_id: number;
    time: string;
    added: any[];
    deleted: any[];
};

export type CreateJoinTeamRequestT = {
    date: Date;
    employee: SelectOptionT;
    team: SelectOptionT;
    message: string;
};

export type JoinTeamRequestT = {
    id: number;
};

export type AddEmployeeRequest = {
    id: number;
    type: RequestTypeT;
    created_by: EmployeeSelectOptionT;
    updated: string;
    status: RequestStatusT;
    can_cancel: boolean;
    can_update: boolean;
    can_restore: boolean;
    can_approve_hr: boolean;
    can_approve_admin: boolean;
    approved_by_hr: SelectOptionT | null;
    approved_by_admin: SelectOptionT | null;
    employee_data: CreateEmployeeT;
    onboarding_data: OnboardingData;
};

export type DismissEmployeeRequest = {
    id: number;
    type: RequestTypeT;
    created_by: EmployeeSelectOptionT;
    updated: string;
    status: RequestStatusT;
    can_cancel: boolean;
    can_approve: boolean;
    can_update: boolean;
    approved_by: SelectOptionT | null;
    employee: EmployeeSelectOptionT;
    youtrack_issue_id: string;
    checklist_checked: boolean;
    dismiss_datetime: string;
    description: string | null;
};

export type AdminImportEmployeeChangesT = {
    id: number;
    label: string;
    changes: {
        field: string;
        before: string;
        after: string;
    }[];
};

export type AdminImportT = {
    id: string | null;
    status: "failed" | "ok" | "no-changes";
    changes: AdminImportEmployeeChangesT[];
    errors: string[];
};

export type ModelFieldMetadataT = {
    name: string;
    label: string | null;
    editable: boolean;
};

export type NewHolidayT = {
    day: string;
    name: string;
    is_working: boolean;
};

export type HolidayT = NewHolidayT & { id: number };

export type NewHolidaySetT = {
    name: string;
    description: string;
};
export type HolidaySetT = NewHolidaySetT & {
    id: number;
    holidays: HolidayT[];
    is_default: boolean;
};

export type UpdateHolidaySetT = NewHolidaySetT & {
    id: number;
};

export type NewEmployeeScheduleExclusionT = {
    start: string;
    end: string;
    type: "vacation" | "unpaid_leave" | "sick_day" | "business_trip";
};

export type MoveEmployeeScheduleExclusionT = {
    employee_id: number;
    weekend: string | null;
    working_day: string | null;
};

export type EmployeeScheduleExclusionMoveT = {
    guid: string;
    weekend: string | null;
    working_day: string | null;
    can_cancel: boolean;
    canceled: string | null;
};

export type DayStatusMapT = {
    [date: string]: { type: DayT; name?: string; is_working?: boolean };
};

export type DayStatusItemsT = {
    items: DayStatusMapT;
};

export type EmployeeDayStatusT = {
    employee: UserInfoT;
    dates: DayStatusMapT;
};

export type EmployeeScheduleExclusionT = {
    id: number;
    can_cancel: boolean;
    canceled: string | null;
    canceled_by: UserInfoT | null;
    days: number;
    end: string;
    guid: string;
    start: string;
    type: DayT;
};

export type NewCooperationTypeT = {
    name: string;
    description: string;
};

export type CooperationTypeT = NewCooperationTypeT & {
    id: number;
    is_archived: boolean;
};

export type DaysOfWeekT = Record<DayOfWeekT, DayT>;

export type EmployeeScheduleT = {
    can_remove: boolean;
    dow: DaysOfWeekT;
    end: string | null;
    holiday_set?: SelectOptionT | null;
    start: string | null;
    vacation_days_per_year: number;
    individual_working_hours: number | null;
};

export type UpdateEmployeeScheduleT = EmployeeScheduleT & {
    id: number;
};

export type EmployeeVacationCorrectionT = {
    id: number;
    days: number;
    created: string;
    created_by: UserInfoT | null;
    description?: string;
    can_delete: boolean;
};

export type NewEmployeeVacationCorrectionT = {
    days: number;
    description?: string;
};

export type NewPolicyRevisionT = {
    text: string;
};

export type PolicyRevisionT = NewPolicyRevisionT & {
    policy_id: number;
    policy_revision: number;
    created: string;
    created_by: UserInfoT | null;
    updated: string | null;
    updated_by: UserInfoT | null;
    published: string | null;
    published_by: UserInfoT | null;
    count_approved: number;
    count_unapproved: number;
};

export type NewPolicyT = {
    name: string;
};

export type PolicyT = NewPolicyT & {
    id: number;
    approved: string | null;
    can_approve: boolean;
    canceled: string | null;
    canceled_by: UserInfoT | null;
    current_revision: number | null;
    quiz: SelectOptionT | null;
    quiz_passed: string | null;
};

export type EmployeeActivityT = {
    source: {
        label: string;
        value: number;
    };
    time: string;
    duration: number;
    action: string;
    target: {
        id: string;
        name: string;
        link: string;
    };
};

export type ActivitySummaryDayT = {
    youtrack: string;
    gerrit_merged: string;
    gerrit_new: string;
    gerrit_reviewed: string;
    gerrit_comments: string;
    cvs: string;
    google_meet: string;
    pararam: string;
    google_drive: string;
    zendesk: string;
    discord_call: string;
    vacations?: number;
    sick_days?: number;
    working_days?: number;
};

export type ActivitySummaryT = {
    employee: UserInfoT;
    days: Record<
        string,
        {
            day_status: DayT;
            has_activity: boolean;
            item: ActivitySummaryDayT;
        }
    >;
    total: ActivitySummaryDayT;
};

export type ActivitySummaryTotalT = {
    employee: UserInfoT;
    item: ActivitySummaryDayT;
};

export type ActivityDayDetail = {
    action: string;
    duration: number;
    source: string;
    target: string;
    time: string;
};

export type ActivityDetailsT = {
    employee: UserInfoT;
    days: Record<
        string,
        {
            day_status: DayT;
            items: ActivityDayDetail[];
        }
    >;
};

export type VacationReportT = {
    employee: UserInfoT;
    item: {
        total_vacation_days_year_end: number;
        total_vacation_days_current: number;
        count_existed_vacations: number;
        count_correction: number;
        free_vacation_days_year_end: number;
        free_vacation_days_current: number;
        count_existed_sick_days: number;
    };
};

export type PresenceDayT = {
    come: string;
    leave: string;
    awake: string;
    away: string;
    total: string;
    missed: number;
    sick_days: number;
    vacations: number;
    working_days: number;
};

export type PresenceDetailsT = {
    employee: UserInfoT;
    days: Record<
        string,
        {
            day_status: DayT;
            has_activity: boolean;
            item: PresenceDayT;
        }
    >;
    total: PresenceDayT;
};

export type PresenceSummaryT = {
    employee: UserInfoT;
    item: {
        awake: string;
        away: string;
        missed: number;
        on_weekend: string;
        sick_days: number;
        total: string;
        vacations: number;
        working_days: number;
    };
};

export type DayOffDetailsReportItemT = {
    employee: UserInfoT;
    items: Array<{
        start: string;
        end: string;
        days: number;
        type: DayT;
    }>;
};

export type DayOffSummaryReportItemT = {
    employee: UserInfoT;
    total: Record<DayT, number>;
};

export type IssuesSettingsT = {
    projects: string[];
    created: string;
    datetime: string;
};

export type DueDateReportIssueT = {
    id: string;
    subject: string;
    severity: string;
    priority: string;
    due_date: string;
    sprints: string;
    resolved: boolean;
    unplanned: boolean;
    created: string;
};

export type DueDateReportItemT = {
    employee: UserInfoT;
    items: DueDateReportIssueT[];
};

export type NewActivitySourceT = {
    type: SelectOptionT;
    name: string;
    description: string;
    active: boolean;
    config: {
        url: string;
        pass: string;
        user: number;
    };
};

export type ActivitySourceT = NewActivitySourceT & {
    id: number;
    activity_collected: string;
};

export type TeamMemberReportItemT = {
    team: {
        id: number;
        name: string;
    };
    items: Array<{
        employee: EmployeeT;
        days: number;
    }>;
};

export type EmployeeActivitySourceAliasT = {
    source: SelectOptionT;
    alias: string | null;
};

export type TMStatusT = "come" | "away" | "awake" | "leave";

export type TMEmployeeStatusT = {
    status: TMStatusT;
    updated: string | null;
};

export type TMEmployeeSetStatusT = {
    status: TMStatusT;
    source: string;
};

export interface INewGroup {
    name: string;
    members: Array<{ value: string | number }>;
    public: boolean;
}

export interface IGroup extends INewGroup {
    id: number;
    members: EmployeeSelectOptionT[];
    editable: boolean;
}

export interface IUpdateGroup {
    id: number;
    name?: string;
    members?: Partial<EmployeeSelectOptionT>[];
    public?: boolean;
}

export type NewChangelogT = {
    name: string;
    content: string;
    release_date: string | null;
};

export type ChangelogT = NewChangelogT & {
    id: number;
    created: string;
    updated: string;
};

export type UpdateChangelogT = {
    id: number;
    name?: string;
    content?: string;
    release_date?: string | null;
};

export type NewPortalT = {
    name: string;
    description: string;
    confluence_space_keys: string;
    youtrack_project: string;
};

export type PortalT = NewPortalT & {
    id: number;
    created: string;
    updated: string;
    is_active: boolean;
};

export type UpdatePortalT = {
    id: number;
    name?: string;
    description?: string;
    confluence_space_keys?: string;
    youtrack_project?: string;
    is_active?: boolean;
};

export type NewPortalGroupT = {
    name: string;
    portal_id: number;
};

export type PortalGroupT = {
    id: number;
    name: string;
    portal: PortalT;
    created: string;
    updated: string;
    is_active: boolean;
};

export type UpdatePortalGroupT = {
    id: number;
    name?: string;
    is_active?: boolean;
};

export type ArticleLinksT = {
    webui: string;
    tinyui: string;
    self: string;
};

export type ArticleExpandableT = {
    container: string;
    metadata: string;
    extensions: string;
    operations: string;
    children: string;
    history: string;
    ancestors: string;
    body: string;
    version: string;
    descendants: string;
    space: string;
};

export type ArticleResultGlobalContainerT = {
    title: string;
    displayUrl: string;
};

export type ArticleT = {
    content: {
        id: string;
        type: string;
        status: string;
        title: string;
        restrictions: any;
        _links: ArticleLinksT;
        _expandable: ArticleExpandableT;
    };
    title: string;
    excerpt: string;
    url: string;
    resultGlobalContainer: ArticleResultGlobalContainerT;
    entityType: string;
    iconCssClass: string;
    lastModified: string;
    friendlyLastModified: string;
    timestamp: number;
};

export type ArticleResponseLinksT = {
    self: string;
    next: string;
    base: string;
    context: string;
};

export type ArticlesResponseT = {
    results: ArticleT[];
    start: number;
    limit: number;
    size: number;
    cqlQuery: string;
    searchDuration: number;
    totalSize: number;
    _links: ArticleResponseLinksT;
};

export type NewServiceT = {
    name: string;
    description: string;
    short_description: string;
    portal_group_id: number;
    icon: string;
    user_fields: ServiceFieldT[];
    predefined_custom_fields: any[];
    tags: string | null;
};

export type FieldTypeT =
    | "string"
    | "text"
    | "number"
    | "select"
    | "file"
    | "date";

export type ServiceFieldT = {
    key: string;
    name: string;
    label: string;
    type: FieldTypeT;
    required: boolean;
    options?: string[];
};

export type ServiceT = {
    id: number;
    name: string;
    description: string;
    short_description: string;
    icon: string;
    user_fields: ServiceFieldT[];
    predefined_custom_fields: any[];
    tags: string | null;
    group: PortalGroupT;
    created: string;
    updated: string;
    is_active: boolean;
};

export type UpdateServiceT = {
    id: number;
    name?: string;
    description?: string;
    short_description?: string;
    portal_group_id?: number;
    icon?: string;
    user_fields?: ServiceFieldT[];
    predefined_custom_fields?: any[];
    is_active?: boolean;
};

export type YTEntityTypeT = {
    $type: string;
};

export type YTUserT = {
    id: string;
    login: string;
    email: string;
    fullName: string;
    avatarUrl: string;
} & YTEntityTypeT;

export type YTProjectT = {
    shortName: string;
    name: string;
    id: string;
} & YTEntityTypeT;

export type YTAttachmentT = {
    id: string;
    name: string;
    size: number;
    extension: string;
    updated: number;
    mimeType: string;
    created: number;
    author: YTUserT;
    thumbnailURL: string;
    url: string;
    issue: {
        id: string;
    } & YTEntityTypeT;
} & YTEntityTypeT;

export type YTCustomFieldT = {
    value: {
        name: string;
    } & YTEntityTypeT;
    name: string;
} & YTEntityTypeT;

export type YTIssueT = {
    id: string;
    idReadable: string;
    updated: number;
    summary: string;
    reporter: YTUserT;
    customFields: Array<YTCustomFieldT>;
    updater: YTUserT;
    created: number;
    resolved: number | null;
    project: YTProjectT;
} & YTEntityTypeT;

export type YTIssueCommentT = {
    id: string;
    text: string;
    author: YTUserT;
    created: number;
    updated: number | null;
    issue: { id: string } & YTEntityTypeT;
    attachments: Array<any>;
} & YTEntityTypeT;

export type YTDetailIssueT = {
    description: string | null;
    attachments: Array<any>;
    comments: Array<YTIssueCommentT>;
} & YTIssueT;

export type HelpCenterRequestDetailT = {
    id: number;
    created_by: UserInfoT;
    request: YTDetailIssueT;
    service: ServiceT;
};

export type UsefulLinkT = {
    id: number;
    name: string;
    link: string;
    description: string | null;
};

export type NewUsefulLinkT = {
    name: string;
    link: string;
    description?: string | null;
};

export type UpdateUsefulLinkT = {
    id: number;
    name?: string;
    link?: string;
    description?: string | null;
};

export type NewHelpCenterRequestT = {
    service_id: number;
    summary: string;
    fields: any;
    description?: string;
};

export type APITokenT = {
    id: number;
    name: string;
    created: string;
    expires_in: number | null;
    token_suffix: string;
};

export type NewAPITokenT = {
    name: string;
    expires_in: number | null;
};

export type CreatedAPITokenT = {
    id: number;
    token: string;
};

export type NewHelpCenterAttachemntT = {
    url: string;
    type: string;
};

export type HelpCenterAttachemntT = {
    id: number;
    created: string;
} & NewHelpCenterAttachemntT;

export type NewNotificationT = {
    recipients: number[];
    subject: string;
    content: string;
    type: string;
    show_on_main_page: boolean;
};

export type NotificationT = {
    id: number;
    read: string | null;
    created: string;
} & Omit<NewNotificationT, "recipients">;

export type UpdateNotificationT = { id: number } & Partial<
    Omit<NotificationT, "id" | "created">
>;

export type YouTrackProjectSettingsT = {
    short_name: string;
    main: boolean;
    tags: string[];
};

export type OnboardingSettingsT = {
    work_start: string;
    work_end: string;
    duration: number;
    max_number_parallel_meetings: number;
    calendar_ids: string[];
    youtrack_projects: YouTrackProjectSettingsT[];
    unavailability_label: string;
    content: string | null;
};

export type UpdateOnboardingSettingsT = Partial<OnboardingSettingsT>;

export type NewEmployeePoolT = {
    name: string;
};

export type UpdateEmployeePoolT = Partial<NewEmployeePoolT> & {
    id: number;
};

export type EmployeePoolT = NewEmployeePoolT & {
    id: number;
};

export type NewQuestionOptionT = {
    question_id: number;
    order: number;
};

export type UpdateQuestionOptionT = {
    id: number;
    content?: string;
    correct?: boolean;
    order?: boolean;
};

export type QuestionOptionT = {
    id: number;
    content: string;
    correct: boolean;
    order: number;
};

export type NewQuestionT = {
    quiz_id: number;
    order: number;
};

export type UpdateQuestionT = {
    id: number;
    title?: string;
    content?: string;
    solution?: string;
    order?: number;
    type?: string;
    required?: boolean;
};

export type QuestionT = {
    id: number;
    title: string;
    content: string;
    solution: string;
    type: string;
    order: number;
    options: QuestionOptionT[];
    created: string;
    updated: string;
    required: boolean;
};

export type NewQuizT = {
    name: string;
    pass_percent: number;
    is_active: boolean;
};

export type QuizT = NewQuizT & {
    id: number;
    pool_question_count: number;
    questions: QuestionT[];
    created: string;
    updated: string;
    hard_confirm: boolean;
};

export type UpdateQuizT = {
    id: number;
    name?: string;
    pass_percent?: number;
    is_active?: boolean;
    pool_question_count?: number;
    hard_confirm?: boolean;
};

export type AnswerT = {
    question_id: number;
    option_id: number | null;
};

export type TakeQuizQuestionOptionT = Pick<QuestionOptionT, "id" | "content">;

export type TakeQuizQuestionT = Pick<QuestionT, "id" | "title" | "content"> & {
    options: TakeQuizQuestionOptionT[];
};

export type TakeQuizT = Pick<QuizT, "id" | "name"> & {
    questions: TakeQuizQuestionT[];
    pass_percent: number;
    result_id: number;
};

export type QuizResultQuestionT = {
    id: number;
    title: string;
    content: string;
    solution: string;
};
export type QuizResultOptionT = {
    id: number;
    content: string;
    selected: boolean;
    correct: boolean;
};

export type QuizResultAnswerT = {
    id: number;
    order: number;
    question: QuizResultQuestionT;
    options: QuizResultOptionT[];
    correct: boolean;
    created: string;
};

export type QuizResultT = {
    id: number;
    employee: UserInfoT;
    quiz: Pick<QuizT, "id" | "name" | "pass_percent">;
    created: string;
    finished: string | null;
    confirmed: string | null;
    answers: QuizResultAnswerT[];
    number_of_answers: number;
    passed: boolean;
    score: number;
    can_confirm: boolean;
};

export type OTPStatusT = {
    created: string;
};

export type OTPTokenT = {
    created: string;
    secret: string;
    link: string;
    period: number;
    digits: number;
    digest: string;
};

export type ContactT = {
    type: ContactTypeT;
    value: string;
};

export type NewCounteragentT = {
    email: string;
    english_name: string;
    username: string | null;
    contacts: ContactT[];
    group: boolean;
    manager: Omit<EmployeeSelectOptionT, "photo">;
    agents: SelectOptionT[];
    team: SelectOptionT | null;
    team_required: boolean;
    organization: SelectOptionT | null;
    schedule: string;
    apply_subagents?: boolean;
};

export type CounteragentT = NewCounteragentT & {
    id: number;
    parent: SelectOptionT | null;
    agents: SelectOptionT[];
    status: string;
    created: string;
    updated: string;
    can_edit: boolean;
};

export type UpdateCounteragentT = Partial<CounteragentT> & { id: number };

export type CredentialsBundleT = {
    openvpn: any | null;
    ssh: any | null;
    certificate: any | null;
    pvpn: any | null;
};

export type CounteragentCredentialsT = {
    id: number;
    counteragent_id: number;
    created_by: UserInfoT;
    request_id: string | null;
    notifications: Array<{ type: number; value: string }>;
    bundle: CredentialsBundleT;
    status: "PENDING" | "UPLOADED" | "ACTIVE" | "UNACTIVE" | "EXPIRED";
    created: string;
    updated: string;
};

export type TeamMemberT = {
    id: string;
    english_name: string;
    pararam: string;
    position: string;
    team_position: string;
    grade: string;
    linked_accounts: EmployeeLinkedAccountT[];
};

export type TeamMemberItemT = TeamMemberT & {
    counteragent: boolean;
    linkedAccounts?: Record<number, { name: string; accountId: string }>;
};

export type NewTeamTagT = {
    name: string;
    description: string;
    color: string | null;
};

export type UpdateTeamTagT = {
    id: number;
    name?: string;
    description?: string;
    color?: string | null;
};

export type TeamTagT = {
    id: number;
    name: string;
    description: string;
    is_archived: boolean;
    color: string | null;
};

export type SelectTagOptionT = SelectOptionT & {
    description: string;
    color: string | null;
};

export type TeamHierarchyT = {
    name: string;
    attributes: {
        id: number;
        manager: UserInfoT | null;
    };
    children: TeamHierarchyT[];
};

export type EmployeeHierarchyT = {
    name: string;
    attributes: EmployeeSelectOptionT;
    children: EmployeeHierarchyT[];
};

export type CredentialsTypeT =
    | "ssh"
    | "password"
    | "certificate"
    | "pvpn"
    | "openvpn";

export type DoneTasksSummaryItemT = {
    issues: number;
    gerrit_commits: number;
    gerrit_comments: number;
    cvs_commits: number;
    vacations: number;
    sick_days: number;
    working_days: number;
    weighted_sum: number;
};

export type DoneTasksSummaryTotalT = {
    employee: UserInfoT;
    item: DoneTasksSummaryItemT;
};

export type DoneTasksSummaryT = {
    employee: UserInfoT;
    days: Record<
        string,
        {
            day_status: DayT;
            has_activity: boolean;
            item: DoneTasksSummaryItemT;
        }
    >;
    total: DoneTasksSummaryItemT;
};

export type PasswordSetT = {
    otp_code: string;
    password: string;
};

export type NewLinkedAccountSourceT = {
    type: SelectOptionT;
    name: string;
    description: string;
    active: boolean;
    public: boolean;
};

export type LinkedAccountSourceT = { id: number } & NewLinkedAccountSourceT;

export type UpdateLinkedAccountSourceT = {
    id: number;
} & Partial<NewLinkedAccountSourceT>;

export type EmployeeLinkedAccountT = {
    source: LinkedAccountSourceT;
    account_id: string;
    active: boolean | null;
};
