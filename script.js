document.addEventListener('DOMContentLoaded', () => {
  const clockInBtn = document.getElementById('clockInBtn');
  const clockOutBtn = document.getElementById('clockOutBtn');
  const exportBtn = document.getElementById('exportBtn');
  const recordTableBody = document.getElementById('recordTableBody');
  const totalHoursElement = document.getElementById('totalHours');
  const clock = document.getElementById('clock');

  let records = JSON.parse(localStorage.getItem('timeRecords')) || [];
  let isClockedIn = JSON.parse(localStorage.getItem('isClockedIn')) || false;
  let currentRecord = JSON.parse(localStorage.getItem('currentRecord')) || null;

  function renderRecords() {
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

          timeInTd.contentEditable = true;
          timeOutTd.contentEditable = true;
          notesTd.contentEditable = true;

          timeInTd.addEventListener('blur', () => {
              updateRecordField(index, 'timeIn', timeInTd.textContent);
          });
          timeOutTd.addEventListener('blur', () => {
              updateRecordField(index, 'timeOut', timeOutTd.textContent);
          });
          notesTd.addEventListener('blur', () => {
              updateRecordField(index, 'notes', notesTd.textContent);
          });

          const removeBtn = document.createElement('button');
            removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" fill="currentColor" viewBox="0 0 512 512"><path d="M 496 256 Q 495 191 464 136 L 464 136 L 464 136 Q 432 81 376 48 Q 319 16 256 16 Q 193 16 136 48 Q 80 81 48 136 Q 17 191 16 256 Q 17 321 48 376 Q 80 431 136 464 Q 193 496 256 496 Q 319 496 376 464 Q 432 431 464 376 Q 495 321 496 256 L 496 256 Z M 0 256 Q 1 186 34 128 L 34 128 L 34 128 Q 68 70 128 34 Q 189 0 256 0 Q 323 0 384 34 Q 444 70 478 128 Q 511 186 512 256 Q 511 326 478 384 Q 444 442 384 478 Q 323 512 256 512 Q 189 512 128 478 Q 68 442 34 384 Q 1 326 0 256 L 0 256 Z M 160 160 L 168 160 L 160 160 L 196 160 L 218 131 L 218 131 Q 220 128 224 128 L 288 128 L 288 128 Q 292 128 294 131 L 316 160 L 316 160 L 328 160 L 352 160 Q 359 161 360 168 Q 359 175 352 176 L 343 176 L 343 176 L 330 354 L 330 354 Q 329 367 320 375 Q 311 384 298 384 L 214 384 L 214 384 Q 201 384 192 375 Q 183 367 182 354 L 169 176 L 169 176 L 160 176 L 160 176 Q 153 175 152 168 Q 153 161 160 160 L 160 160 Z M 216 160 L 296 160 L 216 160 L 296 160 L 284 144 L 284 144 L 228 144 L 228 144 L 216 160 L 216 160 Z M 327 176 L 185 176 L 327 176 L 185 176 L 198 353 L 198 353 Q 200 367 214 368 L 298 368 L 298 368 Q 312 367 314 353 L 327 176 L 327 176 Z" /></svg>`;
            removeBtn.classList = "remove-btn";
            removeBtn.addEventListener('click', () => {
                removeRecord(index);
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

  function updateRecordField(index, field, value) {
      records[index][field] = value;
      if (field === 'timeIn' || field === 'timeOut') {
          if (records[index].timeIn && records[index].timeOut) {
              const timeIn = new Date(`${records[index].date} ${records[index].timeIn}`);
              const timeOut = new Date(`${records[index].date} ${records[index].timeOut}`);
              const durationMs = timeOut - timeIn;
              const durationHrs = Math.floor(durationMs / 3600000);
              const durationMins = Math.floor((durationMs % 3600000) / 60000);
              records[index].duration = `${durationHrs}h ${durationMins}m`;
          } else {
              records[index].duration = '';
          }
      }
      localStorage.setItem('timeRecords', JSON.stringify(records));
      renderRecords();
  }

  function addRecord(type) {
      const now = new Date();
      const nowString = now.toLocaleTimeString();
      const dateString = now.toLocaleDateString();
      
      if (type === 'Clock In') {
          currentRecord = {
              date: dateString,
              timeIn: nowString,
              timeOut: null,
              duration: null,
              notes: ''
          };
          isClockedIn = true;
      } else {
          if (currentRecord && currentRecord.date === dateString) {
              currentRecord.timeOut = nowString;
              const timeIn = new Date(`${currentRecord.date} ${currentRecord.timeIn}`);
              const timeOut = new Date(`${currentRecord.date} ${currentRecord.timeOut}`);
              const durationMs = timeOut - timeIn;
              const durationHrs = Math.floor(durationMs / 3600000);
              const durationMins = Math.floor((durationMs % 3600000) / 60000);
              currentRecord.duration = `${durationHrs}h ${durationMins}m`;
              records.push(currentRecord);
              currentRecord = null;
              isClockedIn = false;
          }
      }
      localStorage.setItem('timeRecords', JSON.stringify(records));
      localStorage.setItem('isClockedIn', JSON.stringify(isClockedIn));
      localStorage.setItem('currentRecord', JSON.stringify(currentRecord));
      renderRecords();
  }

  function removeRecord(index) {
      records.splice(index, 1);
      localStorage.setItem('timeRecords', JSON.stringify(records));
      renderRecords();
  }

  function updateButtonStates() {
      if (isClockedIn) {
          clockInBtn.disabled = true;
          clockOutBtn.disabled = false;
      } else {
          clockInBtn.disabled = false;
          clockOutBtn.disabled = true;
      }
  }

  function updateClock() {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString();
  }

  function createPrintableTable() {
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
        <tbody id="recordTableBody">
            ${records.map(record => `
                <tr>
                    <td>${record.date}</td>
                    <td>${record.notes || ''}</td>
                    <td>${record.timeIn || ''}</td>
                    <td>${record.timeOut || ''}</td>
                    <td>${record.duration || ''}</td>
                </tr>
            `).join('')}
        </tbody>
        <tfoot id="recordTableFooter">
            <tr>
                <td colspan="4">Total Hours</td>
                <td>${totalHoursElement.textContent}</td>
            </tr>
        </tfoot>
    `;
    return printableTable;
    }

  function exportToPDF() {
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

      const content = `
          <div>              
              <table id="export-heading">
                <tr>
                    <td rowspan="3" style="font-weight:bold;text-align:right;padding-right:20px;">From:</td>
                    <td colspan="2" style="text-transform:uppercase;">  ${userName}</td>
                    <td colspan="2" style="padding-left:60px;">Invoice Date: ${invoiceDate}</td>
                </tr>
                <tr>
                    <td colspan="2">  ${role}</td>
                    <td colspan="2" style="padding-left:60px;">Invoice Number: ${invoiceNum}</td>
                </tr>
                <tr>
                    <td colspan="2">  ${emailAddress}</td>
                </tr>
                <tr>
                    <td colspan="5"> </td>
                </tr>
                <tr>
                    <td rowspan="3" style="font-weight:bold;text-align:right;padding-right:20px;">To:</td>
                    <td colspan="2">  ${clientName}</td>
                    <td colspan="2" style="padding-left:60px;">MONTH: ${month}</td>
                </tr>
                <tr>
                    <td colspan="2">  ${clientRole}</td>
                    <td colspan="2" style="padding-left:60px;">BPI Bank account number:</td>
                </tr>
                <tr>
                    <td colspan="2">  ${clientEmail}</td>
                    <td colspan="2" style="padding-left:60px;">${accountNumber}</td>
                </tr>
              </table>
              <hr>
              <h2 style="text-align:center;text-transform:uppercase;line-height:1;margin: 0 0 0 0;">Timesheet / Invoice</h2>
              <h4 style="text-align:center;color:blue;line-height:1;margin: 0 0 0 0;">Pay Period: ${dateRange}</h4>
              ${createPrintableTable().outerHTML}
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

  clockInBtn.addEventListener('click', () => {
      if (!isClockedIn) {
          addRecord('Clock In');
      }
  });

  clockOutBtn.addEventListener('click', () => {
      if (isClockedIn) {
          addRecord('Clock Out');
      }
  });

  exportBtn.addEventListener('click', exportToPDF);

  renderRecords();
  updateClock();
  setInterval(updateClock, 1000);
});
