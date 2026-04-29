/* 
Add login to show the name of the user in the hello message. 
For example, if the user is logged in as "John", the message should say "Hello John! Schedule an Appointment". 
If the user is not logged in,it should not be able to schedule an appointment.
*/

function viewAppointments() {
  return (
    <div className="w-full flex justify-center pt-4">
      <h1 className="mb-4 text-2xl font-semibold text-center">Hello! View your Appointments</h1>
    </div>
  );
}

export default viewAppointments;