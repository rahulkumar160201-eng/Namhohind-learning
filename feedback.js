document.addEventListener("DOMContentLoaded", () => {
    const feedbackForm = document.getElementById("feedbackForm");
    const reviewsList = document.getElementById("reviewsList");
    const averageRatingContainer = document.getElementById("averageRatingContainer");
    const isPageAdmin = document.body.dataset.page === "admin";

    let isAdmin = localStorage.getItem("namhohind_admin_auth") === "true";

    if (isPageAdmin) {
        const loginForm = document.getElementById("adminLoginForm");
        const logoutBtn = document.getElementById("adminLogoutBtn");

        if (isAdmin) {
            document.body.classList.add("admin-mode-active");
            if(logoutBtn) logoutBtn.style.display = "inline-block";
        }

        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const user = document.getElementById("adminUsername").value;
                const pass = document.getElementById("adminPassword").value;
                if (user === "Admin" && pass === "SecurePassword") {
                    isAdmin = true;
                    localStorage.setItem("namhohind_admin_auth", "true");
                    document.body.classList.add("admin-mode-active");
                    document.getElementById("adminLoginError").style.display = "none";
                    if(logoutBtn) logoutBtn.style.display = "inline-block";
                    renderReviews();
                } else {
                    document.getElementById("adminLoginError").style.display = "block";
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                isAdmin = false;
                localStorage.removeItem("namhohind_admin_auth");
                document.body.classList.remove("admin-mode-active");
                logoutBtn.style.display = "none";
                const form = document.getElementById("adminLoginForm");
                if (form) form.reset();
            });
        }
    } else {
        // Enforce normal user mode on public pages, preventing browser inspection manipulation.
        isAdmin = false;
    }

    // Initialize sample reviews if none exist
    if (!localStorage.getItem("namhohindReviews")) {
        const sampleReviews = [
            {
                id: Date.now() + 1,
                name: "Rahul Kumar",
                category: "Bihar GK",
                rating: 5,
                comment: "Excellent platform for BPSC and Bihar Police preparation. The mock tests are very relevant.",
                date: new Date(Date.now() - 86400000 * 2).toLocaleString(),
                pinned: true,
                hidden: false
            },
            {
                id: Date.now() + 2,
                name: "Priya Sharma",
                category: "Current Affairs",
                rating: 4,
                comment: "Very good daily updates. Namhohind AI is also an amazing beta feature!",
                date: new Date(Date.now() - 86400000).toLocaleString(),
                pinned: false,
                hidden: false
            },
            {
                id: Date.now() + 3,
                name: "Amit Singh",
                category: "BPSC",
                rating: 5,
                comment: "The UI is so clean and easy to use on mobile. Loved the question palette.",
                date: new Date().toLocaleString(),
                pinned: false,
                hidden: false
            }
        ];
        localStorage.setItem("namhohindReviews", JSON.stringify(sampleReviews));
    }

    if (feedbackForm) {
        feedbackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const name = document.getElementById("fbName").value.trim();
            const category = document.getElementById("fbCategory").value;
            const ratingInput = document.querySelector('input[name="fbRating"]:checked');
            const comment = document.getElementById("fbComment").value.trim();

            if (!name || !ratingInput || !comment) return;

            const rating = parseInt(ratingInput.value);

            const newReview = {
                id: Date.now(),
                name,
                category,
                rating,
                comment,
                date: new Date().toLocaleString(),
                pinned: false,
                hidden: false
            };

            const reviews = getReviews();
            reviews.unshift(newReview);
            saveReviews(reviews);

            feedbackForm.reset();
            renderReviews();
        });
    }

    function getReviews() {
        return JSON.parse(localStorage.getItem("namhohindReviews")) || [];
    }

    function saveReviews(reviews) {
        localStorage.setItem("namhohindReviews", JSON.stringify(reviews));
    }

    function renderReviews() {
        const reviews = getReviews();
        if (!reviewsList) return;
        reviewsList.innerHTML = "";

        let totalRating = 0;
        let totalCount = reviews.length; 

        // Sort: Pinned first, then chronological (latest first)
        const sortedReviews = [...reviews].sort((a, b) => {
            if (a.pinned === b.pinned) return b.id - a.id;
            return a.pinned ? -1 : 1;
        });

        sortedReviews.forEach(review => {
            totalRating += review.rating;

            // Don't show hidden reviews unless admin
            if (review.hidden && !isAdmin) return;

            const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
            
            const reviewEl = document.createElement("div");
            reviewEl.className = `review-card ${review.pinned ? 'pinned' : ''} ${review.hidden ? 'hidden-review' : ''}`;
            
            let adminActionsHtml = '';
            if (isAdmin) {
                adminActionsHtml = `
                <div class="admin-actions" style="display:flex;">
                    <button class="admin-btn" onclick="window.togglePin(${review.id})">${review.pinned ? 'Unpin' : 'Pin'}</button>
                    <button class="admin-btn" onclick="window.toggleHide(${review.id})">${review.hidden ? 'Unhide' : 'Hide'}</button>
                    <button class="admin-btn delete" onclick="window.deleteReview(${review.id})">Delete</button>
                </div>
                `;
            }

            reviewEl.innerHTML = `
                ${review.pinned ? '<span class="pin-badge">📌 Pinned</span>' : ''}
                <div class="review-header">
                    <div>
                        <div class="review-author">
                            👤 ${review.name}
                            <span class="review-category">${review.category}</span>
                        </div>
                        <div class="review-stars">${stars}</div>
                    </div>
                    <div class="review-date">📅 ${review.date}</div>
                </div>
                <div class="review-comment">💬 ${review.comment}</div>
                ${adminActionsHtml}
            `;
            reviewsList.appendChild(reviewEl);
        });

        if (sortedReviews.length === 0 || (!isAdmin && sortedReviews.every(r => r.hidden))) {
            reviewsList.innerHTML = "<p>No reviews yet. Be the first to share your feedback!</p>";
        }

        // Update Average Rating
        if (averageRatingContainer) {
            const avg = totalCount > 0 ? (totalRating / totalCount).toFixed(1) : 0;
            let avgStarsHtml = "";
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.round(avg)) avgStarsHtml += "★";
                else avgStarsHtml += "☆";
            }

            averageRatingContainer.innerHTML = `
                <span class="avg-stars">${avgStarsHtml}</span>
                <span class="avg-score">${avg}/5</span>
                <span class="avg-text">Based on ${totalCount} Reviews</span>
            `;
        }
    }

    if (isPageAdmin) {
        window.togglePin = function(id) {
            if (!isAdmin) return;
            const reviews = getReviews();
            const review = reviews.find(r => r.id === id);
            if (review) {
                review.pinned = !review.pinned;
                saveReviews(reviews);
                renderReviews();
            }
        };

        window.toggleHide = function(id) {
            if (!isAdmin) return;
            const reviews = getReviews();
            const review = reviews.find(r => r.id === id);
            if (review) {
                review.hidden = !review.hidden;
                saveReviews(reviews);
                renderReviews();
            }
        };

        window.deleteReview = function(id) {
            if (!isAdmin) return;
            if (confirm("Are you sure you want to delete this review?")) {
                let reviews = getReviews();
                reviews = reviews.filter(r => r.id !== id);
                saveReviews(reviews);
                renderReviews();
            }
        };
    } else {
        // Explicitly block these from the global window scope on public pages
        window.togglePin = undefined;
        window.toggleHide = undefined;
        window.deleteReview = undefined;
    }

    // Initial render
    renderReviews();
});