// Configurable variables:
const dayStartTime = timeToMinutes("09:00");
const dayEndTime = timeToMinutes("17:00");

// Dom elements for interactions and listeners
const editToggle = document.getElementById('editToggle');
const removeBookingsToggle = document.getElementById('toggleScheduleDeletions');
const customerTable = document.getElementById('custTable');
const shiftTable = document.getElementById('shiftTable');
const shiftTypeHeader = document.querySelector('#filters h3:nth-of-type(1)');
const dayFiltersHeader = document.querySelector('#filters h3:nth-of-type(2)');
const rowFiltersDiv = document.getElementById('rowFilters');
const columnFiltersDiv = document.getElementById('columnFilters');
const themeToggle = document.getElementById('toggleTheme');
const staffToggleButton = document.getElementById('toggleStaffSchedule');
const staffSchedule = document.getElementById('staffSchedule');
const numbersToggleButton = document.getElementById('toggleSupportInfo');
const supportInfo = document.getElementById('supportInfo');
const custToggleButton = document.getElementById('toggleCustomerInfo');
const custInfo = document.getElementById('customerInfo');
const nextWeekBtn = document.getElementById("nextWeekButton");
const currentWeekBtn = document.getElementById("currentWeekButton");
const prevWeekBtn = document.getElementById("prevWeekButton");
const addBookingBtn = document.getElementById('addBooking');
const newBookingModal = document.getElementById('bookingModal');

// Flags / trackers
let currentWeekIndex;
let currentDay;
let shiftData;
let isEditable = editToggle.checked;
const noCache = new Date().getTime(); // For cashe busting, added to fetch requests
let editingBookings = removeBookingsToggle.checked; 

// Onload functions
document.addEventListener("DOMContentLoaded", function () {

    // Fetch schedule data
    fetchShifts(false);
	
    // Fetch customer data
    refreshTableData();

    // Add event listeners for the page
    addPageEventListeners();

    // Add event listeners for the schedule card
    addScheduleEventListeners();

    // Add event listeners for the customer data card
    addCustDataEventListeners();

});

// Add event listeners to the site container
function addPageEventListeners()    {

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
    });

    // Show/hide Schedule Card
    staffToggleButton.addEventListener('click', function() {
        staffSchedule.hidden = !staffSchedule.hidden;
        updateToggleButtonStyle(staffSchedule, staffToggleButton);
    });
    
    // Show/hide Support Info Card
    numbersToggleButton.addEventListener('click', function() {
        supportInfo.hidden = !supportInfo.hidden;
        updateToggleButtonStyle(supportInfo, numbersToggleButton);
    });
    
    // Show/hide Cust Info Card
    custToggleButton.addEventListener('click', function() {
        custInfo.hidden = !custInfo.hidden;
        updateToggleButtonStyle(custInfo, custToggleButton);
    });
}

// Add event listeners for the schedule card
function addScheduleEventListeners()    {

    // Initially hide the filter divs
    rowFiltersDiv.style.display = 'none';
    columnFiltersDiv.style.display = 'none';

    // Toggle filters visibility on click
    shiftTypeHeader.addEventListener('click', function() {
        rowFiltersDiv.style.display = rowFiltersDiv.style.display === 'none' ? 'block' : 'none';
    });

    dayFiltersHeader.addEventListener('click', function() {
        columnFiltersDiv.style.display = columnFiltersDiv.style.display === 'none' ? 'block' : 'none';
    });

    // Next week button
    nextWeekBtn.addEventListener("click", function() {
        const { weekIndex, dayIndex } = findCurrentWeekIndex(shiftData);
        currentWeekIndex = (currentWeekIndex + 1) % shiftData.length;

        if (currentWeekIndex === weekIndex) {
            loadWeekData(weekIndex, dayIndex);
        } else {
            loadWeekData(currentWeekIndex);
        }
    });

    // Current week button
    currentWeekBtn.addEventListener("click", function() {
        const { weekIndex, dayIndex } = findCurrentWeekIndex(shiftData);
        currentWeekIndex = weekIndex;
        loadWeekData(weekIndex, dayIndex);
    });

    // Previous week button
    prevWeekBtn.addEventListener("click", function() {
        const { weekIndex, dayIndex } = findCurrentWeekIndex(shiftData);
        if (currentWeekIndex > 0) {
            currentWeekIndex--;
        } else {
            currentWeekIndex = shiftData.length - 1; // Go to the last week if at the beginning
        }

        if (currentWeekIndex === weekIndex) {
            loadWeekData(weekIndex, dayIndex);
        } else {
            loadWeekData(currentWeekIndex);
        }

    });  

    addBookingBtn.addEventListener('click', function() {
        newBookingModal.style.display = 'flex';
    });

    // Toggle editting
    removeBookingsToggle.addEventListener('change', function() {
        editingBookings = removeBookingsToggle.checked;
        setTableEditable(shiftTable, editingBookings);
    }); 
}

// Add event listeners to the customer table card
function addCustDataEventListeners()    {

    // Toggle editting
    editToggle.addEventListener('change', function() {
        isEditable = editToggle.checked;
        setTableEditable(customerTable, isEditable);
    }); 

}

// Fetch shift data, then populate schedule
function fetchShifts(refresh)  {

    fetch('data/shifts.json?' + noCache)
    .then(response => response.json())
    .then(data => {
        shiftData = data; // Store all weeks data
        const { weekIndex, dayIndex } = findCurrentWeekIndex(shiftData);
        currentDay = null;
        if (!refresh) {
            currentWeekIndex = weekIndex;
            currentDay = dayIndex;
        }
        loadWeekData(currentWeekIndex, currentDay)
    })
    .catch(error => console.error('Error loading shift data:', error));

}

// Function to load week data
function loadWeekData(weekIndex, dayIndex = null) {

    let weekShiftData = shiftData[weekIndex].shifts;
    let weekDate =  shiftData[weekIndex].weekDate;

    // Build the schedule from recieved data.  Updates when week index is changed
    createTableHeaders(weekShiftData, weekDate, dayIndex);
    createTableBody(weekShiftData, dayIndex);

    setTableEditable(shiftTable, editingBookings);

    // Add toggles to filter the schedule.  Could split this off so its not called when the week index changes
    createCheckboxes(Object.values(weekShiftData)[0], 'rowFilters');
    createCheckboxes(weekShiftData, 'columnFilters');

}

// Function to create checkboxes
function createCheckboxes(data, containerId) {

    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing content
    Object.keys(data).forEach((key, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = key;
        checkbox.checked = true;
        checkbox.dataset.columnIndex = index; // Add column index
        checkbox.addEventListener('change', filterTable);
        container.appendChild(checkbox);

        const label = document.createElement('label');
        label.htmlFor = key;
        label.textContent = key;
        container.appendChild(label);
    });

}

// Function to filter the table
function filterTable() {

    const rowCheckboxes = document.querySelectorAll('#rowFilters input[type="checkbox"]');
    const columnCheckboxes = document.querySelectorAll('#columnFilters input[type="checkbox"]');
    const rows = shiftTable.getElementsByTagName('tbody')[0].rows;
    const headers = shiftTable.getElementsByTagName('thead')[0].rows[0].cells; // Header cells

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        row.style.display = rowCheckboxes[i].checked ? '' : 'none';
    }

    for (let j = 0; j < columnCheckboxes.length; j++) {
        let display = columnCheckboxes[j].checked ? '' : 'none';
        headers[j + 1].style.display = display; // Adjusting for the empty cell in the corner
        for (let k = 0; k < rows.length; k++) {
            if (rows[k].cells[j + 1]) {
                rows[k].cells[j + 1].style.display = display;
            }
        }
    }

}

// Function to create table headers
function createTableHeaders(weekShiftData, weekDate, currentDayIndex) {

    const thead = shiftTable.getElementsByTagName('thead')[0];
    thead.innerHTML = '';

    // Create a new header row
    const headerRow = thead.insertRow();
    headerRow.insertCell().textContent = weekDate;

    Object.keys(weekShiftData).forEach((day, index) => {
        let th = document.createElement('th');
        th.textContent = day;
        headerRow.appendChild(th);

        // Highlight current day
        if (currentDayIndex !== null && index === currentDayIndex) {
            th.style.borderLeft = "2px solid #428bca";
            th.style.borderRight = "2px solid #428bca";
            th.style.borderTop = "2px solid #428bca";
        }
    });

}    

// Function to create table body
function createTableBody(data, currentDayIndex) {

    const tableBody = shiftTable.getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing content

    const categories = ["Early", "Late", "Support", "Bookings", "Office", "Notes"];
    categories.forEach(category => {
        let row = tableBody.insertRow();
        let categoryCell = row.insertCell();
        categoryCell.textContent = category;

        Object.keys(data).forEach((day, dayIndex) => {
            if (category === "Bookings" && data[day].Bookings) {
                let bookingCell = row.insertCell();
                let processedBookings = preprocessBookings(data[day].Bookings);
                let slotsContainer = document.createElement('div');
                slotsContainer.className = 'slots-container';
                processedBookings.forEach(slot => {
                    let slotDiv = document.createElement('div');
                    slotDiv.className = `slot ${slot.type}`; // Apply color based on type
                    slotDiv.textContent = `${slot.assignedTo} (${slot.startTime})`;
                
                    // Create a div for additional details
                    let detailsDiv = document.createElement('div');
                    detailsDiv.className = 'slot-details';
                    detailsDiv.innerHTML = `
                        Duration: ${slot.duration} mins<br>
                        Type: ${slot.type}<br>
                        Customer: ${slot.customer}<br>
                        Notes: ${slot.notes}
                    `;
                
                    slotDiv.appendChild(detailsDiv);
                    slotDiv.style.height = calculateHeight(slot.duration) + 'px'; // Set height based on duration

                    // Attempting to add removal functions to each booking if clicked
                    if (slot.assignedTo != null && slot.assignedTo != "") {
                        var removalData = {
                                bookingId: slot.bookingId,
                                weekDay: day,
                                weekIndex: currentWeekIndex,
                                operation: 'remove'
                        }
                        slotDiv.addEventListener("click", function() {
                            if (editingBookings == true) {
                                removeBooking(removalData);
                            }
                        });
                    }

                    slotsContainer.appendChild(slotDiv);
                    // Highlight current day's column
                    if (currentDayIndex !== null && dayIndex === currentDayIndex) {
                        bookingCell.style.borderLeft = "2px solid #428bca";
                        bookingCell.style.borderRight = "2px solid #428bca";
                        /* bookingCell.style.borderBottom = "3px solid red"; */
                    }
                });
                bookingCell.appendChild(slotsContainer);
            } else {
                let cell = row.insertCell();
                cell.textContent = data[day][category] || "";

                cell.addEventListener('blur', function() {
                    var shiftEditData = {
                        editedValue: this.innerText,
                        weekDay: day,
                        type: category,
                        weekIndex: currentWeekIndex,
                        operation: 'editDay'
                    };
                    console.log(shiftEditData);
                    // Send AJAX request to PHP
                    updateScheduleOnServer(shiftEditData);
                });

                // Highlight current day's column
                if (currentDayIndex !== null && dayIndex === currentDayIndex) {
                    cell.style.borderLeft = "2px solid #428bca";
                    cell.style.borderRight = "2px solid #428bca";
                    if (category === "Notes") {
                        cell.style.borderBottom = "2px solid #428bca";
                    }
                }
            }
        });
    });

}

// Function to inject blank bookings for spacing
function preprocessBookings(bookings) {

    // If no bookings, return a full day blank booking
    if (bookings.length === 0) {
        return [createBlankBooking(dayStartTime, dayEndTime, 'No Bookings')];
    }

    // Sort bookings by start time
    bookings.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    let processedBookings = [];
    let lastEndTime = dayStartTime;

    bookings.forEach(booking => {
        const bookingStartTime = timeToMinutes(booking.startTime);
        if (bookingStartTime > lastEndTime) {
            // Insert a blank booking for the gap
            processedBookings.push(createBlankBooking(lastEndTime, bookingStartTime));
        }
        processedBookings.push(booking);
        lastEndTime = bookingStartTime + booking.duration;
    });

    // Optionally, add a blank booking at the end of the day
    if (lastEndTime < dayEndTime) {
        processedBookings.push(createBlankBooking(lastEndTime, dayEndTime));
    }

    return processedBookings;

}

function createBlankBooking(startTime, endTime, assignedTo = "") {

    return {
        type: "Blank",
        startTime: minutesToTime(startTime),
        duration: endTime - startTime,
        assignedTo: assignedTo,
        customer: "",
        notes: ""
    };

}

function timeToMinutes(timeStr) {

    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;

}

function minutesToTime(minutes) {

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

}

function calculateHeight(duration) {

    // Calculate the height of a slot based on its duration
    const baseHeight = 20; // Base height for a unit of duration (e.g., 1 minute)
    return duration * baseHeight;

}

function findCurrentWeekIndex(shiftData) {

    const currentDate = new Date();
    for (let i = 0; i < shiftData.length; i++) {
        const weekDate = parseUKDate(shiftData[i].weekDate);
        const nextWeekDate = i + 1 < shiftData.length ? parseUKDate(shiftData[i + 1].weekDate) : new Date(weekDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (currentDate >= weekDate && currentDate < nextWeekDate) {
            const dayIndex = (currentDate.getDay() + 6) % 7; // Convert to UK week start (Monday)
            return { weekIndex: i, dayIndex };
        }
    }
    return { weekIndex: 0, dayIndex: null }; // Default to the first week if no match is found

}    

function parseUKDate(dateString) {

    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year + 2000, month - 1, day);

}

function populateCustomerTable(rows, searchString) {

    const thead = customerTable.getElementsByTagName('thead')[0];
    const tbody = customerTable.getElementsByTagName('tbody')[0];
    const lowerSearchString = searchString.toLowerCase();

    // List of non-link cases (case insensitive)
    const nonLinkCases = ['local', 'single branch', 'collator', 'single site', 'url', 'unknown', 'peer to peer'];


    // Clear any existing content in tbody
    tbody.innerHTML = '';

    // Skip header row and start from the first data row
    for (let i = 1; i < rows.length; i++) {

        const cells = rows[i].split(',').slice(0, 4);

        // Check if any cell partially matches the search string
        const rowContainsSearchString = cells.some(cell => cell.toLowerCase().includes(lowerSearchString));
        if (rowContainsSearchString || !searchString) {
            const dataRow = tbody.insertRow();

            cells.forEach((cell, index) => {
                let td = dataRow.insertCell();
                td.dataset.rowIndex = i; // row index
                td.dataset.colIndex = index; // column index

                td.addEventListener('blur', function() {
                    const editedValue = this.innerText;
                    const rowIndex = this.dataset.rowIndex;
                    const colIndex = this.dataset.colIndex;
                    // Send AJAX request to PHP
                    updateDataOnServer({
                        operation: 'edit',
                        row: rowIndex,
                        col: colIndex,
                        value: editedValue
                    });
                });
                
                let cellContent = cell.trim(); // .toLowerCase();

                // Check for non-link cases
                let isNonLinkCase = nonLinkCases.some(nonLinkCase => cellContent.toLowerCase().includes(nonLinkCase));
                
                // Remove quotes from beginning and end if present
                cellContent = cellContent.replace(/^"|"$/g, '');

                if (index === 1 && !isNonLinkCase) {
                    // Create a hyperlink
                    let a = document.createElement('a');
                    a.textContent = cellContent;
                    a.href = `http://${cellContent.toLowerCase()}.kudoscloud.co.uk`;
                    a.target = "_blank"; // Open in new tab
                    td.appendChild(a);
                } else {
                    // Regular text
                    td.textContent = cellContent;
                }
            });
        }
    }
    setTableEditable(customerTable, isEditable);

}

function updateToggleButtonStyle(card, toggleButton) {

    if (card.hidden) {
        toggleButton.classList.add('hiddenCard');
    } else {
        toggleButton.classList.remove('hiddenCard');
    }

}

function setTableEditable(table, isEditable) {

    Array.from(table.getElementsByTagName('td')).forEach(td => {
        td.contentEditable = isEditable;
    });

    if (table.id === 'custTable') {

        Array.from(table.getElementsByTagName('tr')).forEach((tr, rowIndex) => {
            // Skip the first row (headings)
            if (rowIndex === 0) return;
            
            if (isEditable) {
                // Add a delete button if in edit mode
                let deleteBtn = document.createElement('button');
                deleteBtn.innerText = 'Delete';
                deleteBtn.onclick = function() {
                    updateDataOnServer({
                        operation: 'remove',
                        row: rowIndex
                    });
                    tr.remove();
                };

                if (tr.cells.length == 4) {
                    let td = tr.insertCell();
                    td.appendChild(deleteBtn);
                    td.classList.add('delete-cell'); // For styling purposes
                }
            } else {
                // Remove the delete button if not in edit mode
                if (tr.lastChild && tr.lastChild.classList.contains('delete-cell')) {
                    tr.removeChild(tr.lastChild);
                }
            }
        });

        const headingRow = table.getElementsByTagName('tr')[0];
        if (isEditable) {
            // Create and add "Add Record" button if not already present
            if (!document.getElementById('addRecordBtn')) {
                let addRecordBtn = document.createElement('button');
                addRecordBtn.id = 'addRecordBtn';
                addRecordBtn.innerText = 'Add';
                addRecordBtn.onclick = function() {
                    // Insert new row at the beginning of the table body
                    const newRow = table.insertRow(1);
                    let newRowData = [];
                
                    for (let i = 0; i < headingRow.cells.length - 1; i++) { // -1 to exclude delete button cell
                        let newCell = newRow.insertCell(i);
                        newCell.contentEditable = true;
                        newCell.dataset.rowIndex = 1; // Set rowIndex for the new row
                        newCell.dataset.colIndex = i; // Set colIndex for each cell
                
                        // Initialize newRowData for each cell as empty
                        newRowData.push('');

                        // Add event listener to the new cell so edits are saved
                        newCell.addEventListener('blur', function() {
                            const editedValue = this.innerText;
                            const rowIndex = this.dataset.rowIndex;
                            const colIndex = this.dataset.colIndex;
                            // Send AJAX request to PHP
                            updateDataOnServer({
                                operation: 'edit',
                                row: rowIndex,
                                col: colIndex,
                                value: editedValue
                            });
                        });
                    }
                
                    // Add delete button cell to new row
                    let deleteCell = newRow.insertCell(headingRow.cells.length - 1);
                    let deleteBtn = document.createElement('button');
                    deleteBtn.innerText = 'Delete';
                    deleteBtn.onclick = function() {
                        updateDataOnServer({
                            operation: 'remove',
                            row: 1
                        });
                        newRow.remove();
                    };
                    deleteCell.appendChild(deleteBtn);
                    deleteCell.classList.add('delete-cell');
                
                    // Add the new row data to server (it will initially be an array of empty strings)
                    updateDataOnServer({
                        operation: 'add',
                        newRow: newRowData
                    });
                };
                
                let td = headingRow.insertCell();
                td.appendChild(addRecordBtn);
            }
        } else {
            // Remove "Add Record" button if in non-edit mode
            let addRecordBtn = document.getElementById('addRecordBtn');
            if (addRecordBtn) {
                addRecordBtn.remove();
            }
            if (headingRow.cells.length == 5) {
                headingRow.removeChild(headingRow.lastChild);
            }
        }
    }

}  

function saveBooking() {
    var startTime = document.getElementById('startTime').value;
    var duration = document.getElementById('duration').value;

    // Perform additional JavaScript validation if necessary
    if (!startTime || !duration) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    var bookingData = {
        bookingId: generateUUID(),
        weekDay: document.getElementById('weekDay').value,
        weekIndex: currentWeekIndex,
        startTime: startTime,
        duration: parseInt(duration),
        assignedTo: document.getElementById('assignedTo').value,
        type: document.getElementById('type').value,
        customer: document.getElementById('customer').value,
        notes: document.getElementById('notes').value,
        operation: 'add'
    };

    console.log(bookingData);
    updateScheduleOnServer(bookingData);

    // Hide the modal on successful data collection
    document.getElementById('bookingModal').style.display = 'none';
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime(); //Timestamp
    var d2 = (performance && performance.now && (performance.now()*1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
    return 'xxxx-xxxx-4xxx-yxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16; //random number between 0 and 16
        if(d > 0){ //Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else { //Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
    });
}

function removeBooking(removalData) {

    console.log(removalData);
    updateScheduleOnServer(removalData);

}

function cancelBooking() {
    // Hide the modal
    newBookingModal.style.display = 'none';
}

function updateDataOnServer(data) {

    fetch('PHP/updateCsv.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        console.log('Success:', data);
        refreshTableData();
    })
    .catch(error => {
        console.error('Error:', error);
    });

}   

function refreshTableData() {

    fetch('data/CustomerList.csv?' + noCache)
        .then(response => response.text())
        .then(csv => {
            const rows = csv.split('\n');
            populateCustomerTable(rows, '');
            document.getElementById('searchInput').addEventListener('input', (e) => {
                populateCustomerTable(rows, e.target.value);
            });
        }).catch(error => console.error('Error loading customer list:', error));

}

function updateScheduleOnServer(data) {
    fetch('PHP/updateSchedule.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`HTTP error! Status: ${response.status} Response: ${text}`);
            });
        }
        return response.text();
    })
    .then(data => {
        console.log('Success:', data);
        fetchShifts(true); 
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
