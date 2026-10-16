import { labels } from "../constants";
export default function Status({ value }) {
  return (
    <span className={"status " + value}>
      <i />
      {labels[value] || value}
    </span>
  );
}
