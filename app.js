function loadFileAsJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                resolve(json);
            } catch (error) {
                reject("Error parsing JSON file");
            }
        };
        reader.onerror = () => reject("Error reading file");
        reader.readAsText(file);
    });
}
function ambil_username(data) {
    const usernames = new Set();
    data.forEach(item => {
        item.string_list_data.forEach(user => {
            usernames.add(user.value);
        });
    });
    return usernames;
}

async function memprosesfile() {
    const followersFile = document.getElementById('followersFile').files[0];
    const followingFile = document.getElementById('followingFile').files[0];
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ""; 

    if (!followersFile || !followingFile) {
        resultsDiv.innerHTML = '<p class="text-center mt-2 dm-mono-light-italic">Unggah kedua file JSON terlebih dahulu!.</p>';
        return;
    }

    try {
        const followersData = await loadFileAsJSON(followersFile);
        const followingData = await loadFileAsJSON(followingFile);

        const followersUsernames = ambil_username(followersData);
        const followingUsernames = ambil_username(followingData.relationships_following);

        const notFollowingBack = [...followingUsernames].filter(username => !followersUsernames.has(username));

        if (notFollowingBack.length > 0) {
            resultsDiv.innerHTML = `<p class="dm-mono-light">Ada ${notFollowingBack.length} akun yang tidak mengikuti kembali:</p>`;
            const list = document.createElement('ul');
            list.className = 'list-disc ml-6 mt-2';
            notFollowingBack.forEach(username => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `https://www.instagram.com/${username}`;
                link.textContent = username;
                link.target = "_blank";
                link.className = 'dm-mono-regular underline';
                listItem.appendChild(link);
                list.appendChild(listItem);
            });
            resultsDiv.appendChild(list);
        } else {
            resultsDiv.innerHTML = '<p class="text-green-500">Tidak ada akun yang tidak mengikuti anda kembali (semua mutual).</p>';
        }        
    } catch (error) {
        resultsDiv.innerHTML = `<p class="text-red-500">${error}</p>`;
    }
}
document.getElementById('processButton').addEventListener('click', memprosesfile);
