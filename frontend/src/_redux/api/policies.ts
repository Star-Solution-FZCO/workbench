import { createApi } from "@reduxjs/toolkit/query/react";
import { apiVersion } from "config";
import {
    AnswerT,
    ApiResponse,
    CustomBaseQueryFn,
    ListRequestParamsT,
    ListResponseT,
    NewPolicyRevisionT,
    NewPolicyT,
    NewQuestionOptionT,
    NewQuestionT,
    NewQuizT,
    PolicyRevisionT,
    PolicyT,
    QuestionOptionT,
    QuestionT,
    QuizResultT,
    QuizT,
    SelectOptionT,
    TakeQuizT,
    UpdateQuestionOptionT,
    UpdateQuestionT,
    UpdateQuizT,
    UserInfoT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = [
    "Policies",
    "Policy",
    "PolicyDiff",
    "PolicyExclusions",
    "PolicyRevision",
    "PolicyRevisionEmployees",
    "PolicyRevisions",
    "Question",
    "QuestionOptions",
    "Questions",
    "Quiz",
    "QuizResult",
    "QuizResults",
    "Quizzes",
];

export const policiesApi = createApi({
    reducerPath: "meApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes,
    endpoints: (build) => ({
        // policy
        getPolicyList: build.query<
            ApiResponse<ListResponseT<PolicyT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/policy/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Policies"],
        }),
        getPolicy: build.query<ApiResponse<PolicyT>, number>({
            query: (id) => ({
                url: `${apiVersion}/policy/${id}`,
                method: "GET",
            }),
            providesTags: ["Policy"],
        }),
        createPolicy: build.mutation<ApiResponse<{ id: number }>, NewPolicyT>({
            query: (body) => ({
                url: `${apiVersion}/policy`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Policies"],
        }),
        updatePolicy: build.mutation<
            ApiResponse<PolicyT>,
            Partial<PolicyT & { quiz_id: number | null }>
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/policy/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Policy", "Policies"],
        }),
        cancelPolicy: build.mutation<ApiResponse<{ success: boolean }>, number>(
            {
                query: (policy_id) => ({
                    url: `${apiVersion}/policy/${policy_id}`,
                    method: "DELETE",
                }),
                invalidatesTags: ["Policy", "Policies"],
            },
        ),
        approvePolicy: build.mutation<ApiResponse<PolicyRevisionT>, number>({
            query: (policy_id) => ({
                url: `${apiVersion}/policy/${policy_id}/approve`,
                method: "PUT",
            }),
            invalidatesTags: [
                "Policy",
                "Policies",
                "PolicyRevision",
                "PolicyRevisionEmployees",
            ],
        }),
        listPolicyRevision: build.query<
            ApiResponse<ListResponseT<PolicyRevisionT>>,
            { policy_id: number } & ListRequestParamsT
        >({
            query: ({ policy_id, ...params }) => ({
                url: `${apiVersion}/policy/${policy_id}/revision/list`,
                method: "GET",
                params,
            }),
            providesTags: ["PolicyRevisions"],
        }),
        getPolicyRevision: build.query<
            ApiResponse<PolicyRevisionT>,
            { policy_id: number; revision_id: number }
        >({
            query: ({ policy_id, revision_id }) => ({
                url: `${apiVersion}/policy/${policy_id}/revision/${revision_id}`,
                method: "GET",
            }),
            providesTags: ["PolicyRevision"],
        }),
        createPolicyRevision: build.mutation<
            {
                policy_id: number;
                policy_revision: number;
            },
            { policy_id: number } & NewPolicyRevisionT
        >({
            query: ({ policy_id, ...body }) => ({
                url: `${apiVersion}/policy/${policy_id}/revision`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["PolicyRevisions"],
        }),
        updatePolicyRevision: build.mutation<
            ApiResponse<{
                policy_id: number;
                policy_revision: number;
            }>,
            { policy_id: number; revision_id: number; text: string }
        >({
            query: ({ policy_id, revision_id, ...body }) => ({
                url: `${apiVersion}/policy/${policy_id}/revision/${revision_id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["PolicyRevision", "PolicyRevisions"],
        }),
        publishPolicyRevision: build.mutation<
            ApiResponse<PolicyRevisionT>,
            { policy_id: number; revision_id: number }
        >({
            query: ({ policy_id, revision_id }) => ({
                url: `${apiVersion}/policy/${policy_id}/revision/${revision_id}/publish`,
                method: "PUT",
            }),
            invalidatesTags: [
                "Policy",
                "Policies",
                "PolicyRevision",
                "PolicyRevisions",
            ],
        }),
        getPolicyRevisionEmployeeList: build.query<
            ApiResponse<ListResponseT<UserInfoT & { approved: string | null }>>,
            {
                policy_id: number;
                revision_id: number;
                approved?: boolean;
            } & ListRequestParamsT
        >({
            query: ({ policy_id, revision_id, ...params }) => ({
                url: `${apiVersion}/policy/${policy_id}/revision/${revision_id}/employee/list`,
                method: "GET",
                params,
            }),
            providesTags: ["PolicyRevisionEmployees"],
        }),
        createPolicyExclusion: build.mutation<
            ApiResponse<any>,
            { policy_id: number; employee_id: number }
        >({
            query: ({ policy_id, ...body }) => ({
                url: `${apiVersion}/policy/${policy_id}/exclusion`,
                method: "POST",
                body,
            }),
            invalidatesTags: [
                "PolicyRevision",
                "PolicyExclusions",
                "PolicyRevisionEmployees",
            ],
        }),
        deletePolicyExclusion: build.mutation<
            ApiResponse<any>,
            { policy_id: number; employee_id: number }
        >({
            query: ({ policy_id, employee_id }) => ({
                url: `${apiVersion}/policy/${policy_id}/exclusion/${employee_id}`,
                method: "DELETE",
            }),
            invalidatesTags: [
                "PolicyRevision",
                "PolicyExclusions",
                "PolicyRevisionEmployees",
            ],
        }),
        listPolicyExclusion: build.query<
            ApiResponse<ListResponseT<UserInfoT & { excluded: string | null }>>,
            { policy_id: number; excluded?: boolean } & ListRequestParamsT
        >({
            query: ({ policy_id, ...params }) => ({
                url: `${apiVersion}/policy/${policy_id}/exclusion/employee/list`,
                method: "GET",
                params,
            }),
            providesTags: ["PolicyExclusions"],
        }),
        notifyUnapprovedEmployees: build.mutation<
            ApiResponse<any>,
            { policy_id: number }
        >({
            query: ({ policy_id }) => ({
                url: `${apiVersion}/policy/${policy_id}/notify`,
                method: "POST",
            }),
        }),
        getPolicyDiff: build.query<
            { text: string },
            { policy_id: number; rev_old: number; rev_new: number }
        >({
            query: ({ policy_id, ...params }) => ({
                url: `${apiVersion}/policy/${policy_id}/diff`,
                method: "GET",
                params,
            }),
            providesTags: ["PolicyDiff"],
        }),
        // quizzes
        listQuiz: build.query<
            ApiResponse<ListResponseT<QuizT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/quiz/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Quizzes"],
        }),
        listQuizSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/quiz/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
        }),
        getQuiz: build.query<QuizT, number>({
            query: (id) => ({
                url: `${apiVersion}/quiz/${id}`,
                method: "GET",
            }),
            transformResponse: (result: ApiResponse<QuizT>) => result.payload,
            providesTags: ["Quiz"],
        }),
        createQuiz: build.mutation<ApiResponse<{ id: number }>, NewQuizT>({
            query: (body) => ({
                url: `${apiVersion}/quiz`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Quizzes"],
        }),
        updateQuiz: build.mutation<ApiResponse<{ id: number }>, UpdateQuizT>({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/quiz/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Quiz", "Quizzes"],
        }),
        deleteQuiz: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/quiz/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Quizzes"],
        }),
        takeQuiz: build.query<TakeQuizT, number>({
            query: (id) => ({
                url: `${apiVersion}/quiz/${id}/take`,
                method: "GET",
            }),
            transformResponse: (result: ApiResponse<TakeQuizT>) =>
                result.payload,
        }),
        submitQuiz: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number; answers: AnswerT[]; result_id: number }
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/quiz/${id}/submit`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Policy", "Policies"],
        }),
        confirmQuizResult: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number; answers: AnswerT[] }
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/quiz/result/${id}/confirm`,
                method: "POST",
                body,
            }),
            invalidatesTags: [
                "Policy",
                "Policies",
                "QuizResult",
                "QuizResults",
            ],
        }),
        listQuizResult: build.query<
            ApiResponse<ListResponseT<QuizResultT>>,
            ListRequestParamsT & { personal?: boolean }
        >({
            query: (params) => ({
                url: `${apiVersion}/quiz/result/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Policy", "Policies", "QuizResults"],
        }),
        getQuizResult: build.query<QuizResultT, number>({
            query: (id) => ({
                url: `${apiVersion}/quiz/result/${id}`,
                method: "GET",
            }),
            transformResponse: (result: ApiResponse<QuizResultT>) =>
                result.payload,
            providesTags: ["QuizResult"],
        }),
        listQuestion: build.query<
            ApiResponse<ListResponseT<QuestionT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/quiz/question/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Questions"],
        }),
        getQuestion: build.query<QuestionT, number>({
            query: (id) => ({
                url: `${apiVersion}/quiz/question/${id}`,
                method: "GET",
            }),
            transformResponse: (result: ApiResponse<QuestionT>) =>
                result.payload,
            providesTags: ["Question"],
        }),
        createQuestion: build.mutation<
            ApiResponse<{ id: number }>,
            NewQuestionT
        >({
            query: (body) => ({
                url: `${apiVersion}/quiz/question`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Quiz", "Questions"],
        }),
        updateQuestion: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateQuestionT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/quiz/question/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Quiz", "Question", "Questions"],
        }),
        deleteQuestion: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/quiz/question/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Quiz", "Question", "Questions"],
        }),
        listQuestionOption: build.query<
            ApiResponse<ListResponseT<QuestionOptionT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/quiz/option/list`,
                method: "GET",
                params,
            }),
            providesTags: ["QuestionOptions"],
        }),
        createQuestionOption: build.mutation<
            ApiResponse<{ id: number }>,
            NewQuestionOptionT
        >({
            query: (body) => ({
                url: `${apiVersion}/quiz/option`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Question", "QuestionOptions"],
        }),
        updateQuestionOption: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateQuestionOptionT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/quiz/option/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Question", "QuestionOptions"],
        }),
        deleteQuestionOption: build.mutation<
            ApiResponse<{ id: number }>,
            number
        >({
            query: (id) => ({
                url: `${apiVersion}/quiz/option/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Question", "QuestionOptions"],
        }),
    }),
});
