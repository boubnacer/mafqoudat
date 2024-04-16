import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetPostsQuery, useUpdatePostMutation } from "../postsApiSlice";

const ReportPage = () => {
  const { id } = useParams();

  const { post } = useGetPostsQuery("postsList", {
    selectFromResult: ({ data }) => ({
      post: data?.entities[id],
    }),
  });

  const [updatePost, { isLoading, isSuccess, isError, error }] =
    useUpdatePostMutation();

  const navigate = useNavigate();

  const [reportedTxt, setReportedTxt] = useState("");

  const onReportedTxtChanged = (e) => setReportedTxt(e.target.value);

  const handleReport = async (e) => {
    await updatePost({
      ...post,
      reported: true,
      reportedTxt: { message: reportedTxt, postLink: `/posts/${id}` },
    });
    navigate("/dash");
  };

  const errContent = error?.data?.message ?? "";

  return (
    <>
      <p>{errContent}</p>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <input
          placeholder="reportedTxt"
          value={reportedTxt}
          onChange={onReportedTxtChanged}
        />
        <button onClick={handleReport}>send</button>
      </form>
    </>
  );
};

export default ReportPage;
