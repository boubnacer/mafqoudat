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
      query: ({ page, pageSize, fl, currentCountry, categoryId }) => ({
        url: "/posts",
        method: "GET",
        params:
          categoryId === "" && fl != ""
            ? { page, pageSize, fl, currentCountry }
            : categoryId != "" && fl === ""
            ? { page, pageSize, categoryId, currentCountry }
            : categoryId != "" && fl != ""
            ? { page, pageSize, categoryId, fl, currentCountry }
            : { page, pageSize, currentCountry },
        validateStatus: (response, result) => {
          return response.status === 200 && !result.isError;
        },
      }),
      transformResponse: (responseData) => {
        const { postsWithUser, pageSize, totalPages, page } = responseData;

        // const loadedPosts = postsWithUser.map((post) => {
        //   post.id = post._id;
        //   return { post, page };
        // });

        // return postsAdapter.setAll(initialState, loadedPosts);

        return { postsWithUser, page, totalPages };
      },
      providesTags: ["Post"],
    }),

    // get post

    getPost: builder.query({
      query: (postId) => `/posts/${postId}`,
      providesTags: ["Post"],
    }),

    // getPost: builder.query({
    //   query: ({ postId }) => ({
    //     url: "/posts",
    //     method: "GET",
    //     params: { postId },
    //     validateStatus: (response, result) => {
    //       return response.status === 200 && !result.isError;
    //     },
    //   }),
    //   transformResponse: (responseData) => {
    //     console.log(
    //       "🚀 ~ file: postsApiSlice.js:54 ~ responseData",
    //       responseData
    //     );

    //     const { post } = responseData;
    //     return { post };
    //   },
    //   providesTags: ["Post"],
    // }),

    // get dashboard ----------------------------------------------------------------------------------
    getDashboard: builder.query({
      query: ({ currentCountry }) => ({
        url: "/dashboard",
        method: "GET",
        params: { currentCountry },
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
        //  postsAdapter.setAll(initialState, loadedPosts);
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
