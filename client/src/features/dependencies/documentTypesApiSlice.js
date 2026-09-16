import { apiSlice } from "../../app/api/apiSlice";

// The document titles a DOCUMENTS listing names, in place of the photo those
// listings are not allowed to carry (server/config/documentTypes.js). Plain
// arrays rather than an entity adapter: this list is read as a list - shown in
// the picker, matched against a search box - and never looked up by id.
export const documentTypesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDocumentTypes: builder.query({
      query: () => ({
        url: "/document-types",
        validateStatus: (response, result) => response.status === 200 && !result?.isError,
      }),
      transformResponse: (responseData) => {
        const documentTypes = responseData?.data || responseData || [];
        return documentTypes.map((documentType) => ({
          ...documentType,
          id: documentType._id || documentType.id,
        }));
      },
      providesTags: [{ type: "DocumentType", id: "LIST" }],
    }),

    // A title a reader could not find. The server answers 200 with the
    // existing row when the title is already there under another spelling and
    // 201 when it really created one, so both answers carry the row to select
    // and the dialog treats them the same.
    createDocumentType: builder.mutation({
      query: ({ arabicLabel, latinLabel }) => ({
        url: "/document-types",
        method: "POST",
        body: { arabicLabel, latinLabel },
      }),
      transformResponse: (responseData) => responseData?.documentType
        ? { ...responseData.documentType, id: responseData.documentType._id || responseData.documentType.id }
        : null,
      invalidatesTags: [{ type: "DocumentType", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDocumentTypesQuery,
  useCreateDocumentTypeMutation,
} = documentTypesApiSlice;
