document.addEventListener('DOMContentLoaded', () => {
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');
    const exportBtn = document.getElementById('exportBtn');
    const configBtn = document.getElementById('configBtn');
    const saveBtn = document.getElementById('saveDetails');
    const recordTableBody = document.getElementById('recordTableBody');
    const totalHoursElement = document.getElementById('totalHours');
    const date = document.getElementById('date');

    const hourHand = document.querySelector('#clock .hour');
    const minuteHand = document.querySelector('#clock .minute');
    const secondHand = document.querySelector('#clock .second');
    const timePeriod = document.querySelector('#clock .period');


    let db;
    let isClockedIn = false;
    let currentRecord = null;

    const modal = document.querySelector('.modal');
    const closeBtn = document.querySelector('.modal-header button.close-modal');

    const request = indexedDB.open('DTRDatabase', 1);

    request.onupgradeneeded = (e) => {
        db = e.target.result;
        db.createObjectStore('timeRecords', { keyPath: 'id', autoIncrement: true });
        db.createObjectStore('settings', { keypath: 'key' });
    }

    request.onsuccess = (e) => {
        db = e.target.result;
        loadSettings();
        renderRecords();
        formInit();
    }

    request.onerror = (e) => {
        console.log('IndexedDB error:',e.target.error);
    }

    function saveRecord(record) {
        const transaction = db.transaction(['timeRecords'], 'readwrite');
        const store = transaction.objectStore('timeRecords');
        store.put(record);
    }

    function deleteRecord(id) {
        const transaction = db.transaction(['timeRecords'], 'readwrite');
        const store = transaction.objectStore('timeRecords');
        store.delete(id);
    }

    function getAllRecords() {
        return new Promise((resolve, reject) => {
            if ( 'undefined' !== typeof(db) ) {
                const transaction = db.transaction(['timeRecords'], 'readonly');
                const store = transaction.objectStore('timeRecords');
                const request = store.getAll();

                request.onsuccess = function(event) {
                    resolve(event.target.result);
                };

                request.onerror = function(event) {
                    console.error(event.target.errorCode);
                    reject(event.target.errorCode);
                };
            }
        });
    }

    function saveSetting(key, value) {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        store.put({ key, value });
    }

    function getSetting(key) {
        return new Promise((resolve, reject) => {
            if ( 'undefined' !== typeof(db) ) {
                // console.log(key)
                const transaction = db.transaction(['settings'], 'readonly');
                const store = transaction.objectStore('settings');
                const request = store.get(key);

                request.onsuccess = function(event) {
                    resolve(event.target.result ? event.target.result.value : null);
                };

                request.onerror = function(event) {
                    reject(event.target.errorCode);
                };
            }
        });
    }

    async function loadSettings() {
        isClockedIn = await getSetting('isClockedIn') || false;
        currentRecord = await getSetting('currentRecord');
        updateButtonStates();
    }


    async function renderRecords() {
        const records = await getAllRecords();
        recordTableBody.innerHTML = '';
        let totalDurationMs = 0;

        records.forEach((record, index) => {
            const tr = document.createElement('tr');
            const dateTd = document.createElement('td');
            const notesTd = document.createElement('td');
            const timeInTd = document.createElement('td');
            const timeOutTd = document.createElement('td');
            const durationTd = document.createElement('td');
            const actionsTd = document.createElement('td');

            dateTd.textContent = record.date;
            notesTd.textContent = record.notes || '';
            timeInTd.textContent = record.timeIn || '';
            timeOutTd.textContent = record.timeOut || '';
            durationTd.textContent = record.duration || '';
            
            dateTd.contentEditable = true;
            timeInTd.contentEditable = true;
            timeOutTd.contentEditable = true;
            notesTd.contentEditable = true;

            dateTd.addEventListener('blur', () => {
                updateRecordField(record.id, 'date', dateTd.textContent);
            });
            timeInTd.addEventListener('blur', () => {
                updateRecordField(record.id, 'timeIn', timeInTd.textContent);
            });
            timeOutTd.addEventListener('blur', () => {
                updateRecordField(record.id, 'timeOut', timeOutTd.textContent);
            });
            notesTd.addEventListener('blur', () => {
                updateRecordField(record.id, 'notes', notesTd.textContent);
            });

            const removeBtn = document.createElement('button');
                removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" fill="currentColor" viewBox="0 0 512 512"><path d="M 496 256 Q 495 191 464 136 L 464 136 L 464 136 Q 432 81 376 48 Q 319 16 256 16 Q 193 16 136 48 Q 80 81 48 136 Q 17 191 16 256 Q 17 321 48 376 Q 80 431 136 464 Q 193 496 256 496 Q 319 496 376 464 Q 432 431 464 376 Q 495 321 496 256 L 496 256 Z M 0 256 Q 1 186 34 128 L 34 128 L 34 128 Q 68 70 128 34 Q 189 0 256 0 Q 323 0 384 34 Q 444 70 478 128 Q 511 186 512 256 Q 511 326 478 384 Q 444 442 384 478 Q 323 512 256 512 Q 189 512 128 478 Q 68 442 34 384 Q 1 326 0 256 L 0 256 Z M 160 160 L 168 160 L 160 160 L 196 160 L 218 131 L 218 131 Q 220 128 224 128 L 288 128 L 288 128 Q 292 128 294 131 L 316 160 L 316 160 L 328 160 L 352 160 Q 359 161 360 168 Q 359 175 352 176 L 343 176 L 343 176 L 330 354 L 330 354 Q 329 367 320 375 Q 311 384 298 384 L 214 384 L 214 384 Q 201 384 192 375 Q 183 367 182 354 L 169 176 L 169 176 L 160 176 L 160 176 Q 153 175 152 168 Q 153 161 160 160 L 160 160 Z M 216 160 L 296 160 L 216 160 L 296 160 L 284 144 L 284 144 L 228 144 L 228 144 L 216 160 L 216 160 Z M 327 176 L 185 176 L 327 176 L 185 176 L 198 353 L 198 353 Q 200 367 214 368 L 298 368 L 298 368 Q 312 367 314 353 L 327 176 L 327 176 Z" /></svg>`;
                removeBtn.classList = "remove-btn";
                removeBtn.addEventListener('click', () => {
                    deleteRecord(record.id);
                    renderRecords();
                });
                actionsTd.appendChild(removeBtn);

            tr.appendChild(actionsTd);
            tr.appendChild(dateTd);
            tr.appendChild(notesTd);
            tr.appendChild(timeInTd);
            tr.appendChild(timeOutTd);
            tr.appendChild(durationTd);
            recordTableBody.appendChild(tr);

            if (record.duration) {
                const [hours, minutes] = record.duration.split(' ').map(part => parseInt(part));
                totalDurationMs += (hours * 3600000) + (minutes * 60000);
            }
        });

        const totalDurationHrs = Math.floor(totalDurationMs / 3600000);
        const totalDurationMins = Math.floor((totalDurationMs % 3600000) / 60000);
        totalHoursElement.textContent = `${totalDurationHrs}h ${totalDurationMins}m`;

        updateButtonStates();
    }

    function updateRecordField(id, field, value) {
        const transaction = db.transaction(['timeRecords'], 'readwrite');
        const store = transaction.objectStore('timeRecords');
        const request = store.get(id);

        request.onsuccess = function(event) {
            const record = event.target.result;
            record[field] = value;

            if (field === 'timeIn' || field === 'timeOut') {
                if (record.timeIn && record.timeOut) {
                    const timeIn = new Date(`${record.date} ${record.timeIn}`);
                    const timeOut = new Date(`${record.date} ${record.timeOut}`);
                    const durationMs = timeOut - timeIn;
                    const durationHrs = Math.floor(durationMs / 3600000);
                    const durationMins = Math.floor((durationMs % 3600000) / 60000);
                    record.duration = `${durationHrs}h ${durationMins}m`;
                } else {
                    record.duration = '';
                }
            }
            saveRecord(record);
            renderRecords();
        }
    }

    function toggleClass(el,con, ...cls) {
        cls.map(e => el.classList.toggle(e, con));
    }

    function updateButtonStates() {
        clockInBtn.disabled = isClockedIn;
        clockOutBtn.disabled = !isClockedIn;
        toggleClass(clockInBtn, isClockedIn, 'opacity-50', 'cursor-not-allowed');
        toggleClass(clockOutBtn, !isClockedIn, 'opacity-50', 'cursor-not-allowed');
    }

    function updateClock() {
        const now = new Date();
        let period = now.toLocaleTimeString().split(" ")[1];
        let time = now.toLocaleTimeString().split(" ")[0].split(":");

        timePeriod.textContent = period;
        hourHand.textContent = time[0];
        minuteHand.textContent = time[1];
        secondHand.textContent = time[2];
    }

    function setClockDate() {
        const now = new Date();
        date.textContent = now.toLocaleString('en-US', { year: 'numeric', month: "short", weekday: 'long', day: "numeric"});
    }

    async function createPrintableTable() {
        const records = await getAllRecords();
        const timeRecord = records.map(record => {return `<tr><td>${record.date}</td><td>${record.notes || ''}</td><td>${record.timeIn || ''}</td><td>${record.timeOut || ''}</td><td>${record.duration || ''}</td>`}).join('')

        const printableTable = document.createElement('table');
        printableTable.id = "records"
        printableTable.innerHTML = `
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Notes</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody id="recordTableBody"></tbody>
            <tfoot id="recordTableFooter">
                <tr>
                    <td colspan="4">Total Hours</td>
                    <td id="totalHours">${totalHoursElement.textContent}</td>
                </tr>
            </tfoot>
        `;
        printableTable.querySelector('#recordTableBody').innerHTML = timeRecord;

        return printableTable.outerHTML;
    }

    async function exportToPDF() {
        var userInformation = await getSetting('dtrDetails');
        var userName,role,emailAddress,dateRange,invoiceDate,clientName,clientEmail,clientRole,accountNumber,month,invoiceNum;

        if ( userInformation ) {
            userName = document.getElementById('userName').value.toUpperCase();
            role = document.getElementById('role').value;
            emailAddress = document.getElementById('email').value;
            dateRange = document.getElementById('dateRange').value;
    
            invoiceDate = document.getElementById('invoiceDate').value;
            clientName = document.getElementById('clientName').value;
            clientEmail = document.getElementById('clientEmail').value;
            clientRole = document.getElementById('clientRole').value;
    
            accountNumber = document.getElementById('accountNumber').value;
            month = document.getElementById('monthToInvoice').value.toUpperCase();
            invoiceNum = document.getElementById('invoiceNum').value;

            userInformation = {
                'user': {
                    'name': userName,
                    'role': role,
                    'email': emailAddress,
                    'accountNumber': accountNumber,
                },
                'client': {
                    'name': clientName,
                    'email': clientEmail,
                    'role': clientRole
                },
                'other': {
                    'account_no': accountNumber,
                    'month': month,
                    'invoice_no': invoiceNum,
                    'invoice_date': invoiceDate,
                    'date_range': dateRange,
                }
            }

            saveDetails(userInformation);
        }

        let output = await createPrintableTable();

        const content = `
            <div>              
                <table id="export-heading">
                    <tr>
                        <td rowspan="3" style="font-weight:bold;text-align:right;padding-right:20px;">From:</td>
                        <td colspan="2" style="text-transform:uppercase;">  ${userInformation.user.name}</td>
                        <td colspan="2" style="padding-left:60px;">Invoice Date: ${userInformation.other.invoice_date}</td>
                    </tr>
                    <tr>
                        <td colspan="2">  ${userInformation.user.role}</td>
                        <td colspan="2" style="padding-left:60px;">Invoice Number: ${userInformation.other.invoice_no}</td>
                    </tr>
                    <tr>
                        <td colspan="2">  ${userInformation.user.email}</td>
                    </tr>
                    <tr>
                        <td colspan="5"> </td>
                    </tr>
                    <tr>
                        <td rowspan="3" style="font-weight:bold;text-align:right;padding-right:20px;">To:</td>
                        <td colspan="2">  ${userInformation.client.name}</td>
                        <td colspan="2" style="padding-left:60px;">MONTH: ${userInformation.other.month}</td>
                    </tr>
                    <tr>
                        <td colspan="2">  ${userInformation.client.role}</td>
                        <td colspan="2" style="padding-left:60px;">BPI Bank account number:</td>
                    </tr>
                    <tr>
                        <td colspan="2">  ${userInformation.client.email}</td>
                        <td colspan="2" style="padding-left:60px;">${userInformation.other.account_no}</td>
                    </tr>
                </table>
                <hr>
                <h2 style="text-align:center;text-transform:uppercase;line-height:1;margin: 0 0 0 0;">Timesheet / Invoice</h2>
                <h4 style="text-align:center;color:blue;line-height:1;margin: 0 0 0 0;">Pay Period: ${userInformation.other.date_range}</h4>
                ${output}
            </div>
        `;

        const opt = {
            margin: 1,
            filename: 'time_records.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().from(content).set(opt).save();
    }

    function saveDetails( json_data ) {
        var userInformation;

        if ( json_data ) {
            saveSetting('dtrDetails', json_data);
        } else {
            const userName = document.getElementById('userName').value.toUpperCase();
            const role = document.getElementById('role').value;
            const emailAddress = document.getElementById('email').value;
            const dateRange = document.getElementById('dateRange').value;

            const invoiceDate = document.getElementById('invoiceDate').value;
            const clientName = document.getElementById('clientName').value;
            const clientEmail = document.getElementById('clientEmail').value;
            const clientRole = document.getElementById('clientRole').value;

            const accountNumber = document.getElementById('accountNumber').value;
            const month = document.getElementById('monthToInvoice').value.toUpperCase();
            const invoiceNum = document.getElementById('invoiceNum').value;

            userInformation = {
                'user': {
                    'name': userName,
                    'role': role,
                    'email': emailAddress,
                    'accountNumber': accountNumber,
                },
                'client': {
                    'name': clientName,
                    'email': clientEmail,
                    'role': clientRole
                },
                'other': {
                    'account_no': accountNumber,
                    'month': month,
                    'invoice_no': invoiceNum,
                    'invoice_date': invoiceDate,
                    'date_range': dateRange,
                }
            }
            saveSetting('dtrDetails', userInformation);
        }
        

        
    }

    async function formInit() {
        let userInformation = await getSetting('dtrDetails');
        // console.log(userInformation)
        if ( userInformation ) {
            document.getElementById('userName').value = userInformation.user.name;
            document.getElementById('role').value = userInformation.user.role;
            document.getElementById('email').value = userInformation.user.email;
            document.getElementById('dateRange').value = userInformation.other.date_range;

            document.getElementById('invoiceDate').value = userInformation.other.invoice_date;
            document.getElementById('clientName').value = userInformation.client.name;
            document.getElementById('clientEmail').value = userInformation.client.email;
            document.getElementById('clientRole').value = userInformation.client.role;

            document.getElementById('accountNumber').value = userInformation.other.account_no;
            document.getElementById('monthToInvoice').value = userInformation.other.month;
            document.getElementById('invoiceNum').value = userInformation.other.invoice_no;
        } 
    }
  
    // Function to open the modal
    function openModal() {
        modal.classList.add('show');
        modal.classList.remove('hidden');
    }
  
    // Function to close the modal
    function closeModal() {
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }

    clockInBtn.addEventListener('click', () => {
        if (!isClockedIn) {
            const now = new Date();
            currentRecord = {
                date: now.toLocaleDateString(),
                timeIn: now.toLocaleTimeString(),
                timeOut: null,
                duration: null,
                notes: ''
            };
            isClockedIn = true;
            saveSetting('isClockedIn', isClockedIn);
            saveSetting('currentRecord', currentRecord);
            renderRecords();
        }
    });

    clockOutBtn.addEventListener('click', () => {
        if (isClockedIn) {
            const now = new Date();
            currentRecord.timeOut = now.toLocaleTimeString();
            const timeIn = new Date(`${currentRecord.date} ${currentRecord.timeIn}`);
            const timeOut = new Date(`${currentRecord.date} ${currentRecord.timeOut}`);
            const durationMs = timeOut - timeIn;
            const durationHrs = Math.floor(durationMs / 3600000);
            const durationMins = Math.floor((durationMs % 3600000) / 60000);
            currentRecord.duration = `${durationHrs}h ${durationMins}m`;
            saveRecord(currentRecord);
            currentRecord = null;
            isClockedIn = false;
            saveSetting('isClockedIn', isClockedIn);
            saveSetting('currentRecord', currentRecord);
            renderRecords();
        }
    });

    exportBtn.addEventListener('click', exportToPDF);

    saveBtn.addEventListener('click', () => {
        saveDetails(null)
    });

    configBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    // Add event listener to the modal background to close the modal when clicked
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-background')) {
        closeModal();
        }
    });

    formInit();
    renderRecords();
    updateClock();
    setClockDate();
    setInterval(updateClock, 1000);
});