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
          ...(fl && { fl }),
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

          return post;
        });

        return { 
          postsWithUser: transformedPosts, 
          page, 
          totalPages 
        };
      },
      providesTags: ["Post"],
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
      providesTags: ["Post"],
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
      providesTags: ["Dashboard"],
    }),

    addNewPost: builder.mutation({
      query: (formData) => ({
        url: "/posts",
        method: "POST",
        body: formData,
      }),
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
      invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
    }),

    // delete post
    deletePost: builder.mutation({
      query: ({ id }) => ({
        url: `/posts`,
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Post", id: arg.id }],
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
