import Link from "next/link"

function Hero() {
 return (
    <div className="flex flex-row items-left gap-4 mt-8">
        <Link href="./" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          Home 
        </Link>
        <Link href="/schedule-appt" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          Schedule Appointment
        </Link>
        <Link href="/appt-list" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          View Appointments
        </Link>
    </div>
 );
}

export default Hero;

