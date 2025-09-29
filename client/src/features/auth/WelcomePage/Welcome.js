import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";

const Welcome = () => {
  useTitle(`Mafqoudat:`);

  const date = new Date();
  const today = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  }).format(date);

  const content = (
    <section className="welcome">
      <p>{today}</p>

      <h1>Welcome !</h1>

      <p>
        <Link to="/dash/posts">View posts</Link>
      </p>

      <p>
        <Link to="/dash/posts/new">Add New post</Link>
      </p>

      <p>
        <Link to="/dash/users">View User Settings</Link>
      </p>
    </section>
  );

  return content;
};
export default Welcome;
