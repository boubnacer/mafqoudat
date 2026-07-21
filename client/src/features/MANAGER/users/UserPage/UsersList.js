import { useGetUsersQuery } from "../usersApiSlice";
import User from "./User";
import useTitle from "../../../hooks/useTitle";
import { LoadingState, ErrorState } from "../../../components/LoadingStates";

const UsersList = () => {
  useTitle("Mafqoudat | Users List");

  const {
    data: users,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useGetUsersQuery("usersList", {
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  let content;

  if (isLoading) content = <LoadingState message="Loading users..." />;

  if (isError) {
    content = (
      <ErrorState
        title="Failed to load users"
        message={error?.data?.message || "Please try again later"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isSuccess) {
    const { ids } = users;

    const tableContent =
      ids?.length && ids.map((userId) => <User key={userId} userId={userId} />);

    content = (
      <table className="table table--users">
        <thead className="table__thead">
          <tr>
            <th scope="col" className="table__th user__username">
              Username
            </th>
            <th scope="col" className="table__th user__roles">
              Country
            </th>
            <th scope="col" className="table__th user__ip">
              IP Address
            </th>
            <th scope="col" className="table__th user__edit">
              Edit
            </th>
          </tr>
        </thead>
        <tbody>{tableContent}</tbody>
      </table>
    );
  }

  return content;
};
export default UsersList;
