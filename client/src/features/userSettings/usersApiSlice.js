import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice"

const usersAdapter = createEntityAdapter({})

const initialState = usersAdapter.getInitialState()

export const usersApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getUsers: builder.query({
            query: () => ({
                url: '/users',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
            transformResponse: responseData => {
                const loadedUsers = responseData.map(user => {
                    user.id = user._id
                    return user
                });
                return usersAdapter.setAll(initialState, loadedUsers)
            },
            transformErrorResponse: (response) => {
                // Handle server error responses
                if (response.status === 500) {
                    return { 
                        status: 500, 
                        data: { message: "Failed to load users. Please try again." } 
                    };
                }
                return response;
            },
            providesTags: (result, error, arg) => {
                if (result?.ids) {
                    return [
                        { type: 'User', id: 'LIST' },
                        ...result.ids.map(id => ({ type: 'User', id }))
                    ]
                } else return [{ type: 'User', id: 'LIST' }]
            }
        }),
        getUserById: builder.query({
            query: (id) => ({
                url: `/users/${id}`,
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
            transformErrorResponse: (response) => {
                if (response.status === 404) {
                    return { 
                        status: 404, 
                        data: { message: "User not found." } 
                    };
                }
                if (response.status === 500) {
                    return { 
                        status: 500, 
                        data: { message: "Failed to load user. Please try again." } 
                    };
                }
                return response;
            },
            providesTags: (result, error, arg) => [{ type: 'User', id: arg }]
        }),
        addNewUser: builder.mutation({
            query: initialUserData => ({
                url: '/users',
                method: 'POST',
                body: {
                    ...initialUserData,
                }
            }),
            transformErrorResponse: (response) => {
                // Handle server error responses
                if (response.status === 400) {
                    return { 
                        status: 400, 
                        data: { message: "Invalid user data. Please check your input." } 
                    };
                }
                if (response.status === 409) {
                    return { 
                        status: 409, 
                        data: { message: "User already exists. Please sign in." } 
                    };
                }
                if (response.status === 500) {
                    return { 
                        status: 500, 
                        data: { message: "Failed to create user. Please try again." } 
                    };
                }
                return response;
            },
            invalidatesTags: [
                { type: 'User', id: "LIST" }
            ]
        }),
        updateUser: builder.mutation({
            query: initialUserData => ({
                url: '/users',
                method: 'PATCH',
                body: {
                    ...initialUserData,
                }
            }),
            transformErrorResponse: (response) => {
                // Handle server error responses
                if (response.status === 400) {
                    return { 
                        status: 400, 
                        data: { message: "Invalid user data. Please check your input." } 
                    };
                }
                if (response.status === 409) {
                    return { 
                        status: 409, 
                        data: { message: "Username already exists." } 
                    };
                }
                if (response.status === 500) {
                    return { 
                        status: 500, 
                        data: { message: "Failed to update user. Please try again." } 
                    };
                }
                return response;
            },
            invalidatesTags: (result, error, arg) => [
                { type: 'User', id: arg.id }
            ]
        }),
        deleteUser: builder.mutation({
            query: ({ id }) => ({
                url: `/users`,
                method: 'DELETE',
                body: { id }
            }),
            transformErrorResponse: (response) => {
                // Handle server error responses
                if (response.status === 400) {
                    return { 
                        status: 400, 
                        data: { message: "Invalid user ID." } 
                    };
                }
                if (response.status === 500) {
                    return { 
                        status: 500, 
                        data: { message: "Failed to delete user. Please try again." } 
                    };
                }
                return response;
            },
            invalidatesTags: (result, error, arg) => [
                { type: 'User', id: arg.id }
            ]
        }),
    }),
})

export const {
    useGetUsersQuery,
    useGetUserByIdQuery,
    useAddNewUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = usersApiSlice

// returns the query result object
export const selectUsersResult = usersApiSlice.endpoints.getUsers.select()

// creates memoized selector
const selectUsersData = createSelector(
    selectUsersResult,
    usersResult => usersResult.data // normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectAllUsers,
    selectById: selectUserById,
    selectIds: selectUserIds
    // Pass in a selector that returns the users slice of state
} = usersAdapter.getSelectors(state => selectUsersData(state) ?? initialState)