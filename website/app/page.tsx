import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
          The GreenWay Dashboard
        </h1>
        <p className="mt-5 text-2xl text-gray-500 dark:text-gray-300">
          A dashboard for monitoring and managing your green initiatives.
        </p>
      </main>
    </div>
  );
}
