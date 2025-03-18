import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4">
      <h2 className="text-lg font-semibold">Notes</h2>
      <ul>
        <li className="mb-2">
          <Link href="/notes" className="text-blue-500 hover:underline">
            All Notes
          </Link>
        </li>
        <li className="mb-2">
          <Link href="/notes/tags" className="text-blue-500 hover:underline">
            Tags
          </Link>
        </li>
      </ul>
    </div>
  );
}
