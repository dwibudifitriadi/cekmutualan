 async function extractJSONFromZip(zipFile, filePath) {
            try {
                const zip = await JSZip.loadAsync(zipFile);
                const file = zip.file(filePath);
                
                if (!file) {
                    throw new Error(`File tidak ditemukan: ${filePath}`);
                }
                
                const content = await file.async('text');
                return JSON.parse(content);
            } catch (error) {
                throw new Error(`Error extracting ${filePath}: ${error.message}`);
            }
        }

        function loadFollowing(data) {
            const usernames = new Set();
            const relationshipsFollowing = data.relationships_following || [];
            for (const item of relationshipsFollowing) {
                const username = (item.title || '').trim().toLowerCase();
                if (username) {
                    usernames.add(username);
                }
            }
            return usernames;
        }

        function loadFollowers(data) {
            const usernames = new Set();
            for (const item of data) {
                const stringData = item.string_list_data || [];
                if (stringData.length > 0 && stringData[0].value) {
                    const username = stringData[0].value.trim().toLowerCase();
                    if (username) {
                        usernames.add(username);
                    }
                }
            }
            return usernames;
        }

        async function memprosesfile() {
            const zipFile = document.getElementById('zipFile').files[0];
            const resultsDiv = document.getElementById('results');
            const processButton = document.getElementById('processButton');
            const statusText = document.getElementById('statusText');
            const lastCheck = document.getElementById('lastCheck');

            if (!zipFile) {
                resultsDiv.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-3xl mb-3">⚠️</div>
                        <p class="dm-mono-regular text-lg">
                            UPLOAD FILE ZIP TERLEBIH DAHULU
                        </p>
                    </div>
                `;
                return;
            }

            try {
                // Show loading state
                processButton.innerHTML = '⏳ PROCESSING...';
                processButton.disabled = true;
                statusText.textContent = 'PROCESSING';
                statusText.className = 'dm-mono-medium bg-yellow-500 text-white px-2 py-1 text-sm';

                // Extract JSON files from ZIP
                const followersData = await extractJSONFromZip(
                    zipFile, 
                    'connections/followers_and_following/followers_1.json'
                );
                const followingData = await extractJSONFromZip(
                    zipFile, 
                    'connections/followers_and_following/following.json'
                );

                // Extract usernames
                const followingUsernames = loadFollowing(followingData);
                const followersUsernames = loadFollowers(followersData);

                // Calculate not following back
                const notFollowingBack = new Set(
                    [...followingUsernames].filter(username => !followersUsernames.has(username))
                );

                const sortedNotFollowingBack = [...notFollowingBack].sort();

                // Update stats
                document.getElementById('followingCount').textContent = followingUsernames.size;
                document.getElementById('followersCount').textContent = followersUsernames.size;
                document.getElementById('notFollowingCount').textContent = notFollowingBack.size;

                // Display results
                if (notFollowingBack.size > 0) {
                    resultsDiv.innerHTML = `
                        <div class="grid gap-3">
                            ${sortedNotFollowingBack.map(username => `
                                <div class="account-card p-4">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-4 text-sm">             
                                            <div>
                                                <a href="https://www.instagram.com/${username}" 
                                                   target="_blank" 
                                                   class="dm-mono-medium text-lg hover:text-pink-500">
                                                    @${username}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    resultsDiv.innerHTML = `
                        <div class="text-center py-12">
                            <div class="text-6xl mb-4">🎉</div>
                            <h4 class="dm-mono-medium text-2xl mb-3">SEMUA MUTUAL!</h4>
                            <p class="dm-mono-regular text-lg">
                                Semua akun yang kamu follow juga follow balik
                            </p>
                        </div>
                    `;
                }

                // Update status
                statusText.textContent = 'DONE';
                statusText.className = 'dm-mono-medium bg-green-500 text-white px-2 py-1 text-sm';
                lastCheck.textContent = new Date().toLocaleDateString('id-ID');

                // Enable download button
                document.getElementById('downloadBtn').disabled = false;

            } catch (error) {
                console.error('Error processing files:', error);
                resultsDiv.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-3xl mb-3">❌</div>
                        <h4 class="dm-mono-medium text-xl mb-2">ERROR</h4>
                        <p class="dm-mono-regular">
                            ${error.message || error}
                        </p>
                    </div>
                `;
                statusText.className = 'dm-mono-medium bg-red-500 text-white px-2 py-1 text-sm';
            } finally {
                processButton.innerHTML = '🔍 CEK SEKARANG';
                processButton.disabled = false;
            }
        }

        // Add event listeners
        document.addEventListener('DOMContentLoaded', function () {
            document.getElementById('processButton').addEventListener('click', memprosesfile);

            // Download functionality
            document.getElementById('downloadBtn').addEventListener('click', function () {
                const resultsDiv = document.getElementById('results');
                const links = resultsDiv.querySelectorAll('a');
                const usernames = Array.from(links).map(link => link.textContent.replace('@', ''));

                if (usernames.length > 0) {
                    const content = usernames.join('\n');
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'not_following_back.txt';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            });

            // Share functionality
            document.getElementById('shareBtn').addEventListener('click', function () {
                const notFollowingCount = document.getElementById('notFollowingCount').textContent;
                const followingCount = document.getElementById('followingCount').textContent;

                const text = `Cek mutualan Instagram!
Following: ${followingCount} 
Tidak follow balik: ${notFollowingCount}
Coba di: ${window.location.href}`;

                if (navigator.share) {
                    navigator.share({
                        title: 'Cek Mutualan IG',
                        text: text,
                        url: window.location.href
                    });
                } else {
                    navigator.clipboard.writeText(text).then(() => {
                        alert('Hasil disalin ke clipboard!');
                    });
                }
            });

            // File input styling
            const zipInput = document.getElementById('zipFile');
            zipInput.addEventListener('change', function (e) {
                if (e.target.files.length > 0) {
                    e.target.classList.add('bg-green-100');
                }
            });
        });

