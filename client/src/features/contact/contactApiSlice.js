import { apiSlice } from "../../app/api/apiSlice";

export const contactApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Submit contact form
    submitContactForm: builder.mutation({
      query: (contactData) => ({
        url: "/contact",
        method: "POST",
        body: contactData,
      }),
      transformResponse: (response) => {
        // Handle both old and new response formats
        if (response.data) {
          return response.data;
        }
        return response;
      },
      transformErrorResponse: (response) => {
        // Provide better error messages
        if (response.status === 400) {
          return { 
            status: 400, 
            data: { message: response.data?.message || "Please check your input and try again" } 
          };
        }
        if (response.status === 429) {
          return { 
            status: 429, 
            data: { message: response.data?.message || "Too many requests. Please wait before submitting again." } 
          };
        }
        if (response.status === 500) {
          return { 
            status: 500, 
            data: { message: "Server error. Please try again later." } 
          };
        }
        return response;
      },
    }),

    // Get all contacts (Admin only)
    getAllContacts: builder.query({
      query: ({ page = 1, limit = 10, status, priority, search } = {}) => ({
        url: "/contact",
        method: "GET",
        params: {
          page,
          limit,
          ...(status && { status }),
          ...(priority && { priority }),
          ...(search && { search }),
        },
      }),
      transformResponse: (response) => {
        return response.data || response;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.contacts.map(({ _id }) => ({ type: "Contact", id: _id })),
              { type: "Contact", id: "LIST" },
            ]
          : [{ type: "Contact", id: "LIST" }],
    }),

    // Get contact by ID (Admin only)
    getContactById: builder.query({
      query: (id) => ({
        url: `/contact/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => {
        return response.data || response;
      },
      providesTags: (result, error, id) => [{ type: "Contact", id }],
    }),

    // Update contact (Admin only)
    updateContact: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/contact/${id}`,
        method: "PATCH",
        body: updateData,
      }),
      transformResponse: (response) => {
        return response.data || response;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Contact", id },
        { type: "Contact", id: "LIST" },
      ],
    }),

    // Delete contact (Admin only)
    deleteContact: builder.mutation({
      query: (id) => ({
        url: `/contact/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Contact", id },
        { type: "Contact", id: "LIST" },
      ],
    }),

    // Get contact statistics (Admin only)
    getContactStats: builder.query({
      query: () => ({
        url: "/contact/stats",
        method: "GET",
      }),
      transformResponse: (response) => {
        return response.data || response;
      },
      providesTags: [{ type: "Contact", id: "STATS" }],
    }),
  }),
});

export const {
  useSubmitContactFormMutation,
  useGetAllContactsQuery,
  useGetContactByIdQuery,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetContactStatsQuery,
} = contactApiSlice;
