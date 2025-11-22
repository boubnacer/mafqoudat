import { createSelector, createEntityAdapter } from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";

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
      // Add retry logic for rate limit errors
      retry: (failureCount, error) => {
        if (error?.status === 429) {
          // Retry up to 3 times for rate limit errors with exponential backoff
          return failureCount < 3;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      transformResponse: (responseData, meta, arg) => {
        // Simply return the data as-is without transformations
        return responseData;
      },
      transformErrorResponse: (response) => {
        // Handle server error responses
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: "Invalid request parameters." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to load posts. Please try again." } 
          };
        }
        return response;
      },
      providesTags: ["Post"],
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
            data: { message: "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to load post. Please try again." } 
          };
        }
        return response;
      },
      providesTags: ["Post"],
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
            data: { message: "Invalid country parameter." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to load dashboard data. Please try again." } 
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
      // Add retry logic for rate limit errors
      retry: (failureCount, error) => {
        if (error?.status === 429) {
          return failureCount < 2; // Retry up to 2 times for rate limit errors
        }
        return failureCount < 1; // Retry once for other errors
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
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
            data: { message: "Invalid post data. Please check your input." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to create post. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: [{ type: "Post", id: "LIST" }],
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
            data: { message: "Invalid post data. Please check your input." } 
          };
        }
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to update post. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
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
            data: { message: "Invalid post ID." } 
          };
        }
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to delete post. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
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
            data: { message: "Invalid promotion data. Please check your input." } 
          };
        }
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to request promotion. Please try again." } 
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
            data: { message: "Invalid post ID." } 
          };
        }
        if (response.status === 404) {
          return { 
            status: 404, 
            data: { message: "Post not found." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Failed to mark post as returned. Please try again." } 
          };
        }
        return response;
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Post", id: arg },
        { type: "Post", id: "LIST" }
      ],
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
