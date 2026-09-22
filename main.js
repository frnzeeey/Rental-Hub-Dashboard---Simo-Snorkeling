        // GEAR PRICING & COMMISSION RULES (in PHP)
        const GEAR_PRICING_RULES = {
            "Mask":        { price: 100, ourShare: 50,  lessorShare: 50 },
            "Short Fins":  { price: 150, ourShare: 50,  lessorShare: 100 },
            "Long Fins":   { price: 300, ourShare: 150, lessorShare: 150 },
            "Lifevest":    { price: 100, ourShare: 50,  lessorShare: 50 },
            "GoPro":       { price: 700, ourShare: 400, lessorShare: 300 },
            "Floater":     { price: 100, ourShare: 50,  lessorShare: 50 }
        };

        // TOTAL GEAR STOCK DIRECTORY
        const gearStockDirectory = [
            { name: "Snorkel Mask", code: "Mask", icon: "glasses", totalStock: 35 },
            { name: "Short Fins", code: "Short Fins", icon: "footprints", totalStock: 25 },
            { name: "Long Fins", code: "Long Fins", icon: "waves", totalStock: 20 },
            { name: "Lifevest", code: "Lifevest", icon: "life-buoy", totalStock: 40 },
            { name: "GoPro Camera", code: "GoPro", icon: "camera", totalStock: 10 },
            { name: "Floater", code: "Floater", icon: "disc", totalStock: 15 }
        ];

        // LESSORS DIRECTORY
        let lessorsDirectory = [
            { id: 1, name: "Coral Bay Watersports", type: "Partner Business", location: "Main Beach Station 1", phone: "0917-123-4567", commission: "Standard Split" },
            { id: 2, name: "Oceanic Gear Station", type: "Partner Business", location: "South Cove Docks", phone: "0918-987-6543", commission: "Standard Split" },
            { id: 3, name: "Capt. Mark (Island Guide)", type: "Individual Lessor", location: "Freelance Harbor", phone: "0920-555-0199", commission: "Standard Split" }
        ];

        // ACTIVE RENTALS DATA
        let rentalsData = [];
        let currentAddGearRentalId = null;

        function showToast(message, type = "warning") {
            const container = document.getElementById("toastContainer");
            if (!container) return;

            const toast = document.createElement("div");
            toast.className = `toast-animate pointer-events-auto px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white flex items-center space-x-2 ${
                type === "error" || type === "warning" ? "bg-amber-600" : "bg-teal-600"
            }`;
            toast.innerHTML = `
                <i data-lucide="${type === "error" || type === "warning" ? "alert-circle" : "check-circle"}" class="w-4 h-4"></i>
                <span>${message}</span>
            `;
            container.appendChild(toast);
            if (window.lucide) lucide.createIcons();

            setTimeout(() => {
                toast.classList.add("opacity-0", "transition-opacity", "duration-300");
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }

        function computeTransaction(quantities, lessorType) {
            const M = quantities["Mask"] || 0;
            const V = quantities["Lifevest"] || 0;
            const SF = quantities["Short Fins"] || 0;
            const LF = quantities["Long Fins"] || 0;
            const GP = quantities["GoPro"] || 0;
            const FL = quantities["Floater"] || 0;

            // 1. Total Customer Price is ALWAYS the exact sum of all rented gear unit prices
            const totalCustomerPrice = (M * 100) + (SF * 150) + (LF * 300) + (V * 100) + (GP * 700) + (FL * 100);

            // 2. UNIVERSAL 3-GEAR SET BUNDLE (Any 3 basic gear items: Mask, Vest, Short Fins = 1 Set)
            const totalBundleGearCount = M + V + SF;
            const totalSets = Math.floor(totalBundleGearCount / 3);

            let itemsNeededForSets = totalSets * 3;

            let remSF = SF;
            let remM = M;
            let remV = V;

            // Deduct items consumed to form sets (Short Fins, Mask, Lifevest)
            const takeSF = Math.min(remSF, itemsNeededForSets);
            remSF -= takeSF;
            itemsNeededForSets -= takeSF;

            const takeM = Math.min(remM, itemsNeededForSets);
            remM -= takeM;
            itemsNeededForSets -= takeM;

            const takeV = Math.min(remV, itemsNeededForSets);
            remV -= takeV;
            itemsNeededForSets -= takeV;

            let totalOurShare = 0;
            let totalLessorShare = 0;

            if (lessorType === "In-House") {
                // In-House Hub: 100% of customer price is revenue to our shop
                totalOurShare = totalCustomerPrice;
                totalLessorShare = 0;
            } else {
                // Partner or Individual Lessor:
                // Each complete 3-gear set yields ₱100 Our Share
                totalOurShare += totalSets * 100;

                // Remaining individual items (and all Long Fins, GoPro, Floater) yield standard commission rates:
                totalOurShare += (remM * 50) + 
                                 (remSF * 50) + 
                                 (LF * 150) + 
                                 (remV * 50) + 
                                 (GP * 400) + 
                                 (FL * 50);

                // Lessor Payout Share is precisely Customer Total minus Our Commission Share
                totalLessorShare = Math.max(0, totalCustomerPrice - totalOurShare);
            }

            return {
                totalCustomerPrice,
                totalOurShare,
                totalLessorShare,
                totalSets,
                remMask: remM,
                remVest: remV,
                remShortFins: remSF,
                remLongFins: LF,
                goProQty: GP,
                floaterQty: FL
            };
        }

        function openRentalModal() {
            populatePartnerDropdown();
            resetRentalFormQuantities();
            calculateModalPricing();
            document.getElementById('rentalModal').classList.remove('hidden');
        }

        function closeRentalModal() {
            document.getElementById('rentalModal').classList.add('hidden');
        }

        function populatePartnerDropdown() {
            const select = document.getElementById('partnerLessorSelect');
            if (!select) return;
            select.innerHTML = '';
            const partners = lessorsDirectory.filter(l => l.type === 'Partner Business');
            
            if (partners.length === 0) {
                const opt = document.createElement('option');
                opt.value = "Default Partner Shop";
                opt.innerText = "Default Partner Shop";
                select.appendChild(opt);
            } else {
                partners.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.name;
                    opt.innerText = `${p.name} (${p.location})`;
                    select.appendChild(opt);
                });
            }
        }

        function resetRentalFormQuantities() {
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const chk = document.getElementById(`chk-${name}`);
                const qtyInput = document.getElementById(`qty-${name}`);
                if (chk) chk.checked = false;
                if (qtyInput) qtyInput.value = 0;
            });
            calculateModalPricing();
        }

        function handleCheckboxChange(itemName) {
            const chk = document.getElementById(`chk-${itemName}`);
            const qtyInput = document.getElementById(`qty-${itemName}`);
            if (!chk || !qtyInput) return;

            if (chk.checked) {
                if (parseInt(qtyInput.value) <= 0 || !qtyInput.value) {
                    qtyInput.value = 1;
                }
            } else {
                qtyInput.value = 0;
            }
            calculateModalPricing();
        }

        function handleQuantityInput(itemName) {
            const chk = document.getElementById(`chk-${itemName}`);
            const qtyInput = document.getElementById(`qty-${itemName}`);
            if (!chk || !qtyInput) return;

            const val = parseInt(qtyInput.value) || 0;
            chk.checked = val > 0;
            calculateModalPricing();
        }

        function toggleLessorFields() {
            const selectedTypeElem = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const selectedType = selectedTypeElem ? selectedTypeElem.value : 'In-House';
            const partnerContainer = document.getElementById('partnerLessorContainer');
            const customContainer = document.getElementById('customLessorContainer');

            if (selectedType === 'Partner Business') {
                partnerContainer.classList.remove('hidden');
                customContainer.classList.add('hidden');
            } else if (selectedType === 'Individual Lessor') {
                partnerContainer.classList.add('hidden');
                customContainer.classList.remove('hidden');
            } else {
                partnerContainer.classList.add('hidden');
                customContainer.classList.add('hidden');
            }
            calculateModalPricing();
        }

        function calculateModalPricing() {
            const quantities = {};
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`qty-${name}`);
                quantities[name] = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
            });

            const lessorTypeRadio = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const lessorType = lessorTypeRadio ? lessorTypeRadio.value : 'In-House';

            const breakdown = computeTransaction(quantities, lessorType);

            document.getElementById('previewTotalPrice').innerText = `₱${breakdown.totalCustomerPrice.toLocaleString()}`;
            document.getElementById('previewOurShare').innerText = `₱${breakdown.totalOurShare.toLocaleString()}`;
            document.getElementById('previewLessorShare').innerText = `₱${breakdown.totalLessorShare.toLocaleString()}`;

            const banner = document.getElementById('setDiscountBanner');
            if (breakdown.totalSets > 0) {
                banner.classList.remove('hidden');
                document.getElementById('setTextBanner').innerText = `${breakdown.totalSets} Set Bundle(s) Detected!`;
            } else {
                banner.classList.add('hidden');
            }
        }

        function handleRentalSubmit(event) {
            event.preventDefault();

            const customer = document.getElementById('customerName').value.trim();
            const deposit = document.getElementById('depositHeld').value;
            const dueTime = document.getElementById('dueTime').value;
            const paymentStatusRadio = document.querySelector('input[name="paymentStatusRadio"]:checked');
            const paymentStatus = paymentStatusRadio ? paymentStatusRadio.value : 'Paid';
            const lessorTypeRadio = document.querySelector('input[name="lessorTypeRadio"]:checked');
            const lessorType = lessorTypeRadio ? lessorTypeRadio.value : 'In-House';

            let lessorName = "In-House";
            if (lessorType === "Partner Business") {
                lessorName = document.getElementById('partnerLessorSelect').value;
            } else if (lessorType === "Individual Lessor") {
                const customName = document.getElementById('customLessorName').value.trim();
                if (!customName) {
                    showToast("Please enter the Individual Lessor / Guide's Name.", "warning");
                    return;
                }
                lessorName = customName;

                const phone = document.getElementById('customLessorPhone').value.trim();
                const notes = document.getElementById('customLessorNotes').value.trim();

                if (!lessorsDirectory.some(l => l.name.toLowerCase() === customName.toLowerCase())) {
                    lessorsDirectory.push({
                        id: Date.now(),
                        name: customName,
                        type: "Individual Lessor",
                        location: "Freelance / Local",
                        phone: phone || "N/A",
                        commission: notes || "Standard Split"
                    });
                    renderLessorsGrid();
                }
            }

            const itemQuantities = {};
            let totalItemCount = 0;
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`qty-${name}`);
                const qty = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
                itemQuantities[name] = qty;
                totalItemCount += qty;
            });

            if (totalItemCount === 0) {
                showToast("Please select at least one gear item with a quantity greater than zero.", "warning");
                return;
            }

            const pricingBreakdown = computeTransaction(itemQuantities, lessorType);

            // Format Item String
            const formattedParts = [];
            if (pricingBreakdown.totalSets > 0) formattedParts.push(`Gear Set x${pricingBreakdown.totalSets}`);
            if (pricingBreakdown.remMask > 0) formattedParts.push(`Mask x${pricingBreakdown.remMask}`);
            if (pricingBreakdown.remVest > 0) formattedParts.push(`Lifevest x${pricingBreakdown.remVest}`);
            if (pricingBreakdown.remShortFins > 0) formattedParts.push(`Short Fins x${pricingBreakdown.remShortFins}`);
            if (pricingBreakdown.remLongFins > 0) formattedParts.push(`Long Fins x${pricingBreakdown.remLongFins}`);
            if (pricingBreakdown.goProQty > 0) formattedParts.push(`GoPro x${pricingBreakdown.goProQty}`);
            if (pricingBreakdown.floaterQty > 0) formattedParts.push(`Floater x${pricingBreakdown.floaterQty}`);

            const newRecord = {
                id: Date.now(),
                customer: customer,
                items: formattedParts.join(', '),
                itemQuantities: { ...itemQuantities },
                lessorType: lessorType,
                lessorName: lessorName,
                deposit: deposit,
                dueTime: dueTime,
                paymentStatus: paymentStatus,
                status: 'Active',
                totalCustomerPrice: pricingBreakdown.totalCustomerPrice,
                totalOurShare: pricingBreakdown.totalOurShare,
                totalLessorShare: pricingBreakdown.totalLessorShare
            };

            rentalsData.unshift(newRecord);
            updateKPIs();
            filterTable();
            renderInventoryGrid();
            renderLessorsGrid();
            closeRentalModal();

            document.getElementById('newRentalForm').reset();
            resetRentalFormQuantities();
            toggleLessorFields();
            showToast("Rental order issued successfully!", "success");
        }

        function openAddGearModal(id) {
            const record = rentalsData.find(r => r.id === id);
            if (!record) return;

            currentAddGearRentalId = id;

            document.getElementById('addGearCustomerSubtitle').innerText = `Adding to ${record.customer} (${record.lessorName})`;
            document.getElementById('currentRentedItemsDisplay').innerText = record.items || 'None';

            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const chk = document.getElementById(`addChk-${name}`);
                const qtyInput = document.getElementById(`addQty-${name}`);
                if (chk) chk.checked = false;
                if (qtyInput) qtyInput.value = 0;
            });

            document.getElementById('addGearCurrentTotal').innerText = `₱${record.totalCustomerPrice.toLocaleString()}`;
            document.getElementById('addGearAddedTotal').innerText = `+₱0`;
            document.getElementById('addGearNewTotal').innerText = `₱${record.totalCustomerPrice.toLocaleString()}`;

            document.getElementById('addGearModal').classList.remove('hidden');
        }

        function closeAddGearModal() {
            document.getElementById('addGearModal').classList.add('hidden');
            currentAddGearRentalId = null;
        }

        function handleAddGearCheckboxChange(itemName) {
            const chk = document.getElementById(`addChk-${itemName}`);
            const qtyInput = document.getElementById(`addQty-${itemName}`);
            if (!chk || !qtyInput) return;

            if (chk.checked) {
                if (parseInt(qtyInput.value) <= 0 || !qtyInput.value) {
                    qtyInput.value = 1;
                }
            } else {
                qtyInput.value = 0;
            }
            calculateAddGearLivePricing();
        }

        function handleAddGearQuantityInput(itemName) {
            const chk = document.getElementById(`addChk-${itemName}`);
            const qtyInput = document.getElementById(`addQty-${itemName}`);
            if (!chk || !qtyInput) return;

            const val = parseInt(qtyInput.value) || 0;
            chk.checked = val > 0;
            calculateAddGearLivePricing();
        }

        function calculateAddGearLivePricing() {
            if (!currentAddGearRentalId) return;
            const record = rentalsData.find(r => r.id === currentAddGearRentalId);
            if (!record) return;

            const tempCombinedQuantities = {};
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const existingQty = (record.itemQuantities && record.itemQuantities[name]) ? record.itemQuantities[name] : 0;
                const addQtyInput = document.getElementById(`addQty-${name}`);
                const addQty = addQtyInput ? parseInt(addQtyInput.value) || 0 : 0;
                tempCombinedQuantities[name] = existingQty + addQty;
            });

            const updatedBreakdown = computeTransaction(tempCombinedQuantities, record.lessorType);
            const addedValue = updatedBreakdown.totalCustomerPrice - record.totalCustomerPrice;

            document.getElementById('addGearAddedTotal').innerText = `+₱${Math.max(0, addedValue).toLocaleString()}`;
            document.getElementById('addGearNewTotal').innerText = `₱${updatedBreakdown.totalCustomerPrice.toLocaleString()}`;
        }

        function handleAddGearSubmit(event) {
            event.preventDefault();
            if (!currentAddGearRentalId) return;

            const record = rentalsData.find(r => r.id === currentAddGearRentalId);
            if (!record) return;

            if (!record.itemQuantities) {
                record.itemQuantities = { "Mask": 0, "Short Fins": 0, "Long Fins": 0, "Lifevest": 0, "GoPro": 0, "Floater": 0 };
            }

            let totalAddedCount = 0;
            Object.keys(GEAR_PRICING_RULES).forEach(name => {
                const qtyInput = document.getElementById(`addQty-${name}`);
                const addQty = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
                if (addQty > 0) {
                    record.itemQuantities[name] = (record.itemQuantities[name] || 0) + addQty;
                    totalAddedCount += addQty;
                }
            });

            if (totalAddedCount === 0) {
                showToast("Please enter a quantity for at least one additional gear item.", "warning");
                return;
            }

            const pricingBreakdown = computeTransaction(record.itemQuantities, record.lessorType);

            const formattedParts = [];
            if (pricingBreakdown.totalSets > 0) formattedParts.push(`Gear Set x${pricingBreakdown.totalSets}`);
            if (pricingBreakdown.remMask > 0) formattedParts.push(`Mask x${pricingBreakdown.remMask}`);
            if (pricingBreakdown.remVest > 0) formattedParts.push(`Lifevest x${pricingBreakdown.remVest}`);
            if (pricingBreakdown.remShortFins > 0) formattedParts.push(`Short Fins x${pricingBreakdown.remShortFins}`);
            if (pricingBreakdown.remLongFins > 0) formattedParts.push(`Long Fins x${pricingBreakdown.remLongFins}`);
            if (pricingBreakdown.goProQty > 0) formattedParts.push(`GoPro x${pricingBreakdown.goProQty}`);
            if (pricingBreakdown.floaterQty > 0) formattedParts.push(`Floater x${pricingBreakdown.floaterQty}`);

            record.items = formattedParts.join(', ');
            record.totalCustomerPrice = pricingBreakdown.totalCustomerPrice;
            record.totalOurShare = pricingBreakdown.totalOurShare;
            record.totalLessorShare = pricingBreakdown.totalLessorShare;

            updateKPIs();
            filterTable();
            renderInventoryGrid();
            renderLessorsGrid();
            closeAddGearModal();
            showToast("Additional gear appended to order!", "success");
        }

        function openLessorModal() {
            document.getElementById('addLessorModal').classList.remove('hidden');
        }

        function closeLessorModal() {
            document.getElementById('addLessorModal').classList.add('hidden');
        }

        function handleNewLessorSubmit(event) {
            event.preventDefault();
            const name = document.getElementById('newLessorName').value.trim();
            const type = document.getElementById('newLessorType').value;
            const location = document.getElementById('newLessorLocation').value.trim() || 'General Beach Area';
            const phone = document.getElementById('newLessorPhone').value.trim() || 'N/A';
            const commission = document.getElementById('newLessorCommission').value.trim() || 'Standard Split';

            if (!name) return;

            lessorsDirectory.push({
                id: Date.now(),
                name,
                type,
                location,
                phone,
                commission
            });

            renderLessorsGrid();
            populatePartnerDropdown();
            closeLessorModal();
            showToast("New lessor registered!", "success");
        }

        function filterTable() {
            const search = document.getElementById('searchInput').value.toLowerCase();
            const statusF = document.getElementById('statusFilter').value;
            const paymentF = document.getElementById('paymentFilter').value;

            const tbody = document.getElementById('rentalsTableBody');
            const emptyState = document.getElementById('emptyTableState');
            if (!tbody || !emptyState) return;

            tbody.innerHTML = '';

            const filtered = rentalsData.filter(item => {
                const matchSearch = item.customer.toLowerCase().includes(search) || item.items.toLowerCase().includes(search) || item.lessorName.toLowerCase().includes(search);
                const matchStatus = statusF === 'ALL' || item.status === statusF;
                const matchPayment = paymentF === 'ALL' || item.paymentStatus === paymentF;
                return matchSearch && matchStatus && matchPayment;
            });

            if (filtered.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }

            filtered.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/80 transition-colors border-b border-slate-100";

                let statusClass = "bg-slate-100 text-slate-700 border-slate-200";
                if (item.status === 'Active') statusClass = "bg-sky-50 text-sky-700 border-sky-200 font-semibold";
                else if (item.status === 'Returned') statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
                else if (item.status === 'Overdue') statusClass = "bg-amber-50 text-amber-700 border-amber-200 font-bold";
                else if (item.status === 'Damaged') statusClass = "bg-red-50 text-red-700 border-red-200 font-bold";

                let lessorBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                if (item.lessorType === "Partner Business") lessorBadgeClass = "bg-purple-50 text-purple-700 border-purple-200 font-semibold";
                else if (item.lessorType === "Individual Lessor") lessorBadgeClass = "bg-sky-50 text-sky-800 border-sky-200 font-semibold";

                tr.innerHTML = `
                    <td class="py-4 px-5 font-bold text-slate-900">${item.customer}</td>
                    <td class="py-4 px-5">
                        <span class="font-medium text-slate-800 block">${item.items}</span>
                        <span class="text-[10px] text-slate-400 block">Due by ${item.dueTime}</span>
                    </td>
                    <td class="py-4 px-5">
                        <span class="inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full border ${lessorBadgeClass}">
                            ${item.lessorName}
                        </span>
                    </td>
                    <td class="py-4 px-5">
                        <span class="bg-slate-100 text-slate-700 font-medium text-[11px] px-2 py-1 rounded-md border border-slate-200">
                            ${item.deposit}
                        </span>
                    </td>
                    <td class="py-4 px-5 font-extrabold text-slate-900">₱${item.totalCustomerPrice.toLocaleString()}</td>
                    <td class="py-4 px-5 font-bold text-teal-600">₱${item.totalOurShare.toLocaleString()}</td>
                    <td class="py-4 px-5">
                        <select onchange="updatePaymentStatus(${item.id}, this.value)" class="text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer ${item.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}">
                            <option value="Paid" ${item.paymentStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                            <option value="Unpaid" ${item.paymentStatus === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                        </select>
                    </td>
                    <td class="py-4 px-5">
                        <select onchange="updateStatus(${item.id}, this.value)" class="text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer ${statusClass}">
                            <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Returned" ${item.status === 'Returned' ? 'selected' : ''}>Returned</option>
                            <option value="Overdue" ${item.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                            <option value="Damaged" ${item.status === 'Damaged' ? 'selected' : ''}>Damaged</option>
                        </select>
                    </td>
                    <td class="py-4 px-5 text-right flex items-center justify-end space-x-1.5">
                        <button onclick="openAddGearModal(${item.id})" class="inline-flex items-center space-x-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] rounded-lg transition-colors border border-teal-200">
                            <i data-lucide="plus-circle" class="w-3 h-3"></i>
                            <span>+ Gear</span>
                        </button>
                        <button onclick="deleteRental(${item.id})" class="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors" title="Delete Record">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (window.lucide) lucide.createIcons();
        }

        function updateStatus(id, newStatus) {
            const item = rentalsData.find(r => r.id === id);
            if (item) {
                item.status = newStatus;
                updateKPIs();
                renderInventoryGrid();
                filterTable();
            }
        }

        function updatePaymentStatus(id, newStatus) {
            const item = rentalsData.find(r => r.id === id);
            if (item) {
                item.paymentStatus = newStatus;
                updateKPIs();
                filterTable();
            }
        }

        function deleteRental(id) {
            rentalsData = rentalsData.filter(r => r.id !== id);
            updateKPIs();
            renderInventoryGrid();
            filterTable();
            showToast("Rental record removed.", "info");
        }

        function updateKPIs() {
            const activeRentals = rentalsData.filter(r => r.status === 'Active');
            const overdueRentals = rentalsData.filter(r => r.status === 'Overdue');

            let totalRev = 0;
            let totalOur = 0;
            let totalLessor = 0;

            rentalsData.forEach(r => {
                totalRev += r.totalCustomerPrice;
                totalOur += r.totalOurShare;
                totalLessor += r.totalLessorShare;
            });

            document.getElementById('kpiActiveRentals').innerText = activeRentals.length;
            document.getElementById('kpiOverdue').innerText = overdueRentals.length;
            document.getElementById('kpiTotalRevenue').innerText = `₱${totalRev.toLocaleString()}`;
            document.getElementById('kpiOurShare').innerText = `₱${totalOur.toLocaleString()}`;
            document.getElementById('kpiLessorPayoutSub').innerText = `₱${totalLessor.toLocaleString()} payout to lessors`;
        }

        function renderInventoryGrid() {
            const container = document.getElementById('inventoryGrid');
            if (!container) return;
            container.innerHTML = '';

            const activeOutCounts = {};
            gearStockDirectory.forEach(g => activeOutCounts[g.code] = 0);

            rentalsData.filter(r => r.status === 'Active' || r.status === 'Overdue').forEach(r => {
                if (r.itemQuantities) {
                    Object.keys(r.itemQuantities).forEach(code => {
                        activeOutCounts[code] = (activeOutCounts[code] || 0) + r.itemQuantities[code];
                    });
                }
            });

            gearStockDirectory.forEach(gear => {
                const outCount = activeOutCounts[gear.code] || 0;
                const available = Math.max(0, gear.totalStock - outCount);

                const card = document.createElement('div');
                card.className = "bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3";
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2.5">
                            <div class="p-2 bg-teal-50 text-teal-600 rounded-xl">
                                <i data-lucide="${gear.icon}" class="w-5 h-5"></i>
                            </div>
                            <h4 class="font-bold text-slate-800 text-sm">${gear.name}</h4>
                        </div>
                        <span class="text-xs font-bold text-slate-400">Total: ${gear.totalStock}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-center">
                        <div class="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                            <span class="text-[10px] uppercase font-bold text-emerald-600 block">Available</span>
                            <span class="text-lg font-extrabold text-emerald-700">${available}</span>
                        </div>
                        <div class="bg-sky-50/60 p-2 rounded-xl border border-sky-100">
                            <span class="text-[10px] uppercase font-bold text-sky-600 block">Active Out</span>
                            <span class="text-lg font-extrabold text-sky-700">${outCount}</span>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            if (window.lucide) lucide.createIcons();
        }

        function renderLessorsGrid() {
            const container = document.getElementById('lessorsGrid');
            if (!container) return;
            container.innerHTML = '';

            lessorsDirectory.forEach(lessor => {
                const card = document.createElement('div');
                card.className = "bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between";

                let typeBadge = "bg-purple-50 text-purple-700 border-purple-200";
                if (lessor.type === "Individual Lessor") typeBadge = "bg-sky-50 text-sky-700 border-sky-200";

                card.innerHTML = `
                    <div class="space-y-3">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-bold text-slate-900 text-sm">${lessor.name}</h4>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadge} mt-1 inline-block">
                                    ${lessor.type}
                                </span>
                            </div>
                            <div class="p-2 bg-slate-50 text-slate-400 rounded-xl">
                                <i data-lucide="store" class="w-4 h-4"></i>
                            </div>
                        </div>

                        <div class="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                            <p class="flex items-center gap-1.5">
                                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i> ${lessor.location}
                            </p>
                            <p class="flex items-center gap-1.5">
                                <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i> ${lessor.phone}
                            </p>
                            <p class="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-400"></i> ${lessor.commission || 'Standard Split'}
                            </p>
                        </div>
                    </div>

                    <div class="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                        <button onclick="openEditLessorModal(${lessor.id})" class="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-colors border border-slate-200 cursor-pointer">
                            <i data-lucide="edit-2" class="w-3 h-3"></i>
                            <span>Edit</span>
                        </button>
                        <button onclick="deleteLessor(${lessor.id})" class="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px] rounded-lg transition-colors border border-red-200 cursor-pointer">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                            <span>Delete</span>
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });

            if (window.lucide) lucide.createIcons();
        }

        function openEditLessorModal(id) {
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            document.getElementById('editLessorId').value = lessor.id;
            document.getElementById('editLessorName').value = lessor.name;
            document.getElementById('editLessorType').value = lessor.type;
            document.getElementById('editLessorLocation').value = lessor.location;
            document.getElementById('editLessorPhone').value = lessor.phone;
            document.getElementById('editLessorCommission').value = lessor.commission || 'Standard Split';

            document.getElementById('editLessorModal').classList.remove('hidden');
        }

        function closeEditLessorModal() {
            document.getElementById('editLessorModal').classList.add('hidden');
        }

        function handleEditLessorSubmit(event) {
            event.preventDefault();
            const id = parseInt(document.getElementById('editLessorId').value);
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            const oldName = lessor.name;
            const newName = document.getElementById('editLessorName').value.trim();
            const newType = document.getElementById('editLessorType').value;
            const newLocation = document.getElementById('editLessorLocation').value.trim() || 'General Beach Area';
            const newPhone = document.getElementById('editLessorPhone').value.trim() || 'N/A';
            const newCommission = document.getElementById('editLessorCommission').value.trim() || 'Standard Split';

            if (!newName) return;

            lessor.name = newName;
            lessor.type = newType;
            lessor.location = newLocation;
            lessor.phone = newPhone;
            lessor.commission = newCommission;

            // Sync rental records referencing the old name
            rentalsData.forEach(r => {
                if (r.lessorName === oldName) {
                    r.lessorName = newName;
                    r.lessorType = newType;
                }
            });

            renderLessorsGrid();
            populatePartnerDropdown();
            filterTable();
            closeEditLessorModal();
            showToast("Lessor details updated successfully!", "success");
        }

        function deleteLessor(id) {
            const lessor = lessorsDirectory.find(l => l.id === id);
            if (!lessor) return;

            // Guardrail: check active/recent rental references
            const activeRentalsCount = rentalsData.filter(r => r.lessorName === lessor.name).length;
            if (activeRentalsCount > 0) {
                showToast(`Cannot delete ${lessor.name}: active in ${activeRentalsCount} rental transaction(s).`, "warning");
                return;
            }

            lessorsDirectory = lessorsDirectory.filter(l => l.id !== id);
            renderLessorsGrid();
            populatePartnerDropdown();
            showToast(`Lessor "${lessor.name}" removed from directory.`, "info");
        }

        function switchTab(tab) {
            document.getElementById('view-dashboard').classList.add('hidden');
            document.getElementById('view-inventory').classList.add('hidden');
            document.getElementById('view-lessors').classList.add('hidden');

            document.getElementById('nav-dashboard').className = "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all";
            document.getElementById('nav-inventory').className = "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all";
            document.getElementById('nav-lessors').className = "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all";

            if (tab === 'dashboard') {
                document.getElementById('view-dashboard').classList.remove('hidden');
                document.getElementById('nav-dashboard').className = "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20 transition-all";
                document.getElementById('pageTitle').innerText = "Rental Dashboard";
            } else if (tab === 'inventory') {
                document.getElementById('view-inventory').classList.remove('hidden');
                document.getElementById('nav-inventory').className = "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20 transition-all";
                document.getElementById('pageTitle').innerText = "Equipment Inventory";
            } else if (tab === 'lessors') {
                document.getElementById('view-lessors').classList.remove('hidden');
                document.getElementById('nav-lessors').className = "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20 transition-all";
                document.getElementById('pageTitle').innerText = "Lessors Directory";
            }
        }

        // INITIALIZE ON WINDOW LOAD
        window.onload = function() {
            if (window.lucide) lucide.createIcons();
            populatePartnerDropdown();
            updateKPIs();
            filterTable();
            renderInventoryGrid();
            renderLessorsGrid();
        };