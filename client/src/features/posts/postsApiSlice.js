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
      query: ({ page, pageSize, fl, currentCountry, categoryId, search, language = 'en' }) => ({
        url: "/posts",
        method: "GET",
        params: {
          page,
          pageSize,
          ...(fl !== undefined && fl !== null && { fl }),
          ...(currentCountry && { currentCountry }),
          ...(categoryId && { categoryId }),
          ...(search && { search }),
          language
        },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData, meta, arg) => {
        const { postsWithUser, pageSize, totalPages, page } = responseData;
        const language = arg?.language || 'en';

        // Transform post data to handle new multilingual structure
        const transformedPosts = postsWithUser.map(post => {
          // Ensure foundLost data is properly structured
          if (post.foundLost && typeof post.foundLost === 'object') {
            // Use the label for the current language
            const foundLostLabel = post.foundLost.labels?.[language] || post.foundLost.labels?.en || post.foundLost.code;
            post.foundLostLabel = foundLostLabel;
          }
          
          // Ensure country data is properly structured
          if (post.country && typeof post.country === 'object') {
            const countryLabel = post.country.labels?.[language] || post.country.labels?.en || post.country.code;
            post.countryLabel = countryLabel;
          }

          // Ensure city data is properly structured
          if (post.cityLabels && typeof post.cityLabels === 'object') {
            const cityLabel = post.cityLabels[language] || post.cityLabels.en || post.cityName || post.city;
            post.cityLabel = cityLabel;
          } else if (post.cityName) {
            post.cityLabel = post.cityName;
          } else if (post.city && typeof post.city === 'string') {
            post.cityLabel = post.city;
          }

          return post;
        });

        return { 
          postsWithUser: transformedPosts, 
          page, 
          totalPages 
        };
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
        return `${queryArgs.page || 1}-${queryArgs.pageSize || 10}-${queryArgs.fl || 'all'}-${queryArgs.currentCountry || ''}-${queryArgs.categoryId || ''}-${queryArgs.search || ''}-${queryArgs.language || 'en'}`;
      },
    }),

    // get post
    getPost: builder.query({
      query: ({ postId, language = 'en' }) => ({
        url: `/posts/${postId}`,
        params: { language }
      }),
      transformResponse: (responseData, meta, arg) => {
        const post = responseData;
        const language = arg?.language || 'en';
        
        // Transform post data to handle new multilingual structure
        if (post.foundLost && typeof post.foundLost === 'object') {
          const foundLostLabel = post.foundLost.labels?.[language] || post.foundLost.labels?.en || post.foundLost.code;
          post.foundLostLabel = foundLostLabel;
        }
        
        if (post.country && typeof post.country === 'object') {
          const countryLabel = post.country.labels?.[language] || post.country.labels?.en || post.country.code;
          post.countryLabel = countryLabel;
        }

        return post;
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
      query: ({ currentCountry, language = 'en' }) => ({
        url: "/dashboard",
        method: "GET",
        params: { currentCountry, language },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        const {
          trendingPost,
          recentFounds,
          recentLosts,
          totalFounds,
          totalLosts,
          totalPosts,
          formattedLocations,
          createdToday,
        } = responseData;

        return {
          trendingPost,
          recentFounds,
          recentLosts,
          totalFounds,
          totalLosts,
          totalPosts,
          formattedLocations,
          createdToday,
        };
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
        return `${queryArgs.currentCountry || ''}-${queryArgs.language || 'en'}`;
      },
    }),

    addNewPost: builder.mutation({
      query: (formData) => ({
        url: "/posts",
        method: "POST",
        body: formData,
      }),
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
        url: "/posts",
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
  }),
});

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useAddNewPostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetDashboardQuery,
  useRequestPromotionMutation,
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
