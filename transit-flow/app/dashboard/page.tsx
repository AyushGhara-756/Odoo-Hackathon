export default function Dashboard() {
    return (
        <div>
            <div>
                <p>FILTERS</p>
                <div>
                    <label htmlFor="vehicle_type">Vehicle Type</label>
                    <select name="vehicle_type">
                        <option value="All">All</option>
                        <option value="Cars">Cars</option>
                        <option value="Van">Van</option>
                        <option value="Truck">Truck</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="status">Status</label>
                    <select name="status">
                        <option value="onTrip">All</option>
                        <option value="Completed">Cars</option>
                        <option value="Dispatched">Van</option>
                        <option value="Draft">Truck</option>
                    </select>
                </div>
            </div>
        </div>
    );
}