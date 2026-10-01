import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";

// getPosts and getUserPosts below used to carry a `retry`/`retryDelay` pair
// meant to back off and retry on a 429. Neither is a real RTK Query endpoint
// option - the library's actual retry mechanism wraps the baseQuery itself
// (`retry(fetchBaseQuery(...))` from '@reduxjs/toolkit/query/react'), which
// apiSlice.js never does - so these fields were silently ignored on every
// request and never retried anything. Removed rather than wired up for real:
// that's a baseQuery-level decision affecting every endpoint at once, not a
// per-endpoint patch. Same dead pattern removed from
// dependenciesApiSlice.js and the `retry`/`retryDelay` hook options passed
// to useGetPostsQuery in PostsList.js.

const postsAdapter = createEntityAdapter({
  // sortComparer: (a, b) => (a.returned === b.returned ? 0 : a.returned ? 1 : -1),
  // selectId: (post) => (post.id = post._id),
});

const initialState = postsAdapter.getInitialState();

export const postsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all post and trended one
    getPosts: builder.query({
      query: ({ page, pageSize, fl, currentCountry, categoryId, categoryIds, cityId, search, language = 'en' }) => ({
        url: "/posts",
        method: "GET",
        params: {
          page,
          pageSize,
          fl: fl || '', // Always send fl parameter
          ...(currentCountry && { currentCountry }),
          ...(categoryId && { categoryId }), // Single category (backward compatibility)
          ...(categoryIds && categoryIds.length > 0 && { categoryIds: Array.isArray(categoryIds) ? categoryIds.join(',') : categoryIds }), // Multiple categories
          ...(cityId && { cityId }),
          ...(search && { search }),
          language
        },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData, meta, arg) => {
        // Simply return the data as-is without transformations
        return responseData;
      },
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response?.data?.message || "Invalid request parameters." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to load posts. Please try again." } 
          };
        }
        return response;
      },
      // Bare "Post" only matches a bare-"Post" invalidation - every mutation
      // below invalidates the id-scoped { type: "Post", id: "LIST" }/{ id }
      // shape instead, which RTK Query never matches against this provider,
      // so create/update/delete/mark-returned all left this list showing
      // stale data until the 60s cache expiry.
      providesTags: (result) =>
        result?.postsWithUser
          ? [
              { type: "Post", id: "LIST" },
              ...result.postsWithUser.map((post) => ({ type: "Post", id: post._id })),
            ]
          : [{ type: "Post", id: "LIST" }],
      // Add cache key based on language to ensure proper cache invalidation
      serializeQueryArgs: ({ queryArgs }) => {
        const categoryKey = queryArgs.categoryIds && queryArgs.categoryIds.length > 0
          ? (Array.isArray(queryArgs.categoryIds) ? queryArgs.categoryIds.join(',') : queryArgs.categoryIds)
          : (queryArgs.categoryId || '');
        return `${queryArgs.page || 1}-${queryArgs.pageSize || 10}-${queryArgs.fl || 'all'}-${queryArgs.currentCountry || ''}-${categoryKey}-${queryArgs.cityId || ''}-${queryArgs.search || ''}-${queryArgs.language || 'en'}`;
      },
    }),

    // get post
    getPost: builder.query({
      query: ({ postId, language = 'en' }) => ({
        url: `/posts/${postId}`,
        params: { language }
      }),
            transformResponse: (responseData, meta, arg) => {
        // Simply return the data as-is without transformations
        return responseData;
      },
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: response?.data?.message || "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to load post. Please try again." } 
          };
        }
        return response;
      },
      // id-scoped, so updatePost/deletePost/markPostAsReturned's own
      // { type: "Post", id: arg.id } invalidation actually reaches it - see
      // the getPosts note above.
      providesTags: (result, error, arg) => [{ type: "Post", id: arg.postId }],
      // Add cache key based on language to ensure proper cache invalidation
      serializeQueryArgs: ({ queryArgs }) => {
        return `${queryArgs.postId || ''}-${queryArgs.language || 'en'}`;
      },
    }),

    // get dashboard ----------------------------------------------------------------------------------
    getDashboard: builder.query({
      query: ({ currentCountry, language = 'en', nocache, ts } = {}) => ({
        url: "/dashboard",
        method: "GET",
        params: { 
          currentCountry, 
          language,
          ...(nocache ? { nocache: true } : {}),
          ...(ts ? { ts } : {})
        },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData, meta, arg) => {
        // Simply return the data as-is without transformations
        return responseData;
      },
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response?.data?.message || "Invalid country parameter." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to load dashboard data. Please try again." } 
          };
        }
        return response;
      },
      providesTags: ["Dashboard"],
      // Add cache key based on language to ensure proper cache invalidation
      serializeQueryArgs: ({ queryArgs }) => {
        return `${queryArgs.currentCountry || ''}-${queryArgs.language || 'en'}-${queryArgs.ts || ''}-${queryArgs.nocache ? '1' : '0'}`;
      },
    }),

    getUserPosts: builder.query({
      query: ({ page = 1, pageSize = 8, language = 'en' } = {}) => ({
        url: "/posts/user",
        method: "GET",
        params: {
          page,
          pageSize,
          language
        },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      providesTags: (result, error, arg) => {
        if (result?.ids) {
          return [
            { type: "Post", id: "USER_POSTS" },
            ...result.ids.map(id => ({ type: "Post", id }))
          ];
        } else return [{ type: "Post", id: "USER_POSTS" }];
      },
    }),

    addNewPost: builder.mutation({
      query: (formData) => {
        return {
          url: "/posts",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response) => {
        return response;
      },
      transformErrorResponse: (response) => {
        
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response?.data?.message || "Invalid post data. Please check your input." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to create post. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: [
        { type: "Post", id: "LIST" },
        { type: "Dashboard" },
        // A new listing can produce match pairs on the opposite side, so the
        // match panels are stale from here on. The scan itself runs
        // asynchronously server-side; the navbar bell's poll picks up anything
        // that lands after this invalidation.
        "PostMatch",
        "Notification"
      ],
    }),

    updatePost: builder.mutation({
      query: (initialPost) => ({
        url: `/posts`,
        method: "PATCH",
        body: {
          ...initialPost,
        },
      }),
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response?.data?.message || "Invalid post data. Please check your input." } 
          };
        }
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: response?.data?.message || "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to update post. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Post", id: arg.id },
        // Editing changes the fields the matcher scores on, and deleting drops
        // the pairs entirely - either way the stored matches are re-derived.
        "PostMatch",
        "Notification"
      ],
    }),

    // delete post
    deletePost: builder.mutation({
      query: ({ id }) => ({
        url: `/posts`,
        method: "DELETE",
        body: { id },
      }),
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response?.data?.message || "Invalid post ID." } 
          };
        }
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: response?.data?.message || "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to delete post. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Post", id: arg.id },
        // Editing changes the fields the matcher scores on, and deleting drops
        // the pairs entirely - either way the stored matches are re-derived.
        "PostMatch",
        "Notification"
      ],
    }),

    // Request promotion for a lost item
    requestPromotion: builder.mutation({
      query: (promotionData) => ({
        url: "/promotion/request",
        method: "POST",
        body: promotionData,
      }),
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response?.data?.message || "Invalid promotion data. Please check your input." } 
          };
        }
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: response?.data?.message || "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to request promotion. Please try again." } 
          };
        }
        return response;
      },
    }),

    // Mark post as returned
    markPostAsReturned: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}/mark-returned`,
        method: "PATCH",
      }),
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response?.data?.message || "Invalid post ID." } 
          };
        }
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: response?.data?.message || "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: response?.data?.message || "Failed to mark post as returned. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Post", id: arg },
        { type: "Post", id: "LIST" },
        { type: "Dashboard" },
        // The item is home: its match pairs are closed server-side and its
        // alerts drop out of the inbox, so both caches have to be refetched.
        "PostMatch",
        "Notification"
      ],
    }),

    // Comment thread on a post. One list endpoint serves all three sources
    // (site, Facebook, Instagram) already merged and sorted server-side - see
    // server/controllers/commentsController.js.
    getPostComments: builder.query({
      query: ({ postId, page = 1, pageSize = 20 }) => ({
        url: `/posts/${postId}/comments`,
        params: { page, pageSize },
      }),
      providesTags: (result, error, arg) => [{ type: "Comment", id: arg.postId }],
    }),

    addComment: builder.mutation({
      query: ({ postId, text }) => ({
        url: `/posts/${postId}/comments`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Comment", id: arg.postId }],
    }),

    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Comment", id: arg.postId }],
    }),

    reportComment: builder.mutation({
      query: ({ postId, commentId, reasonType, reason }) => ({
        url: `/posts/${postId}/comments/${commentId}/report`,
        method: "POST",
        body: { reasonType, reason },
      }),
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useGetUserPostsQuery,
  useAddNewPostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetDashboardQuery,
  useRequestPromotionMutation,
  useMarkPostAsReturnedMutation,
  useGetPostCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useReportCommentMutation,
} = postsApiSlice;

// returns the query result object
export const selectPostsResult = postsApiSlice.endpoints.getPosts.select();

// creates memoized selector
const selectPostsData = createSelector(
  selectPostsResult,
  (postsResult) => postsResult.data // normalized state object with ids & entities
);

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
  // Pass in a selector that returns the posts slice of state
} = postsAdapter.getSelectors(
  (state) => selectPostsData(state) ?? initialState
);
