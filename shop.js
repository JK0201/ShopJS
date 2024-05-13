//First time render
let items = [];
let filterItems = [];
let cartItems = [];
let totalCost = 0;

document.querySelectorAll('.header-list li')[0].style.color = 'white';

$.get('./store.json')
    .then((data) => {
        items = data.products;
        adjustList(items);
    });

//Search items
document.querySelector('.input-box').addEventListener('input', function (e) {
    let search = e.target.value.trim();
    let regex = new RegExp(search, 'gi');

    if (!search) {
        document.querySelector('.item-list').innerHTML = '';
        adjustList(items);
        return;
    } else {
        filterItems = [];
        items.forEach((item, idx) => {
            if (item.title.includes(search) || item.brand.includes(search)) {
                filterItems.push(item);
            }
        });

        document.querySelector('.item-list').innerHTML = '';

        if (filterItems.length > 0) {
            adjustList(filterItems);
            filterItems.forEach((item, idx) => {
                let title = document.querySelectorAll('.text-box h2');
                let brand = document.querySelectorAll('.text-box p');

                if (item.title.includes(search)) {
                    title[idx].innerHTML = title[idx].innerHTML.replace(regex, `<h2 class='highlight'>${search}</h2>`);
                }
                if (item.brand.includes(search)) {
                    brand[idx].innerHTML = brand[idx].innerHTML.replace(regex, `<span class=highlight>${search}</span>`);
                }
            });
        } else {
            document.querySelector('.item-list').innerHTML =
                `
                    <div class="no-result">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <h1>검색 결과 없음</h1>
                    </div>
                `;
        }
    }
});

//Cart items
//onClick add btn
document.querySelector('.item-list').addEventListener('click', function (e) {
    let cartBox = document.querySelector('.cart-items');
    let addBtn = document.querySelectorAll('.product-cards button');

    addBtn.forEach((item, idx) => {
        if (e.target == addBtn[idx]) {
            if (!items[idx].cnt) {
                items[idx].cnt = 1;
                cartItems.push(items[idx]);
            } else {
                items[idx].cnt++;
            }
            cartBox.innerHTML = '';
            cartBox.style.height = '100%';
            cartItem(cartItems);
        }
    });
});

//Quntity change
document.addEventListener('change', function (e) {
    let itemCnt = document.querySelectorAll('.item-cnt');
    let cntVal = e.target.value;

    cartItems.forEach((item, idx) => {
        if (e.target == itemCnt[idx]) {
            if (cntVal == '' || cntVal == 0 || cntVal.includes('.') || cntVal.includes('e')) {
                itemCnt[idx].value = item.cnt;
                return;
            } else {
                item.cnt = parseInt(cntVal);
            }
        }
    });
    calcCost(cartItems);
});

//Cart dnd event
document.querySelector('.item-list').addEventListener('dragstart', function (e) {
    let itemId = e.target.getAttribute('item-id');
    e.dataTransfer.setData('itemId', itemId);
});

document.querySelector('.cart-items').addEventListener('dragover', function (e) {
    e.preventDefault();
    this.style.backgroundColor = '#314952';
});

document.querySelector('.cart-items').addEventListener('drop', function (e) {
    e.preventDefault();
    this.style.height = '100%';
    let itemId = e.dataTransfer.getData('itemId');

    items.forEach((item, idx) => {
        if (item.id == itemId) {
            if (!item.cnt) {
                item.cnt = 1;
                cartItems.push(item);
            } else {
                item.cnt++;
            }
        }
    });
    this.innerHTML = '';
    cartItem(cartItems);
});

document.querySelector('.item-list').addEventListener('dragend', function (e) {
    document.querySelector('.cart-items').style.backgroundColor = 'black';
});

//Cart item removed
document.addEventListener('click', function (e) {
    let delBtn = document.querySelectorAll('.del-btn');
    cartItems.forEach((item, idx) => {
        if (e.target == delBtn[idx]) {
            cartItems[idx].cnt = 0;
            cartItems = cartItems.filter((delItem) => {
                return item != delItem;
            });
            document.querySelector('.cart-items').innerHTML = '';
            cartItem(cartItems);
        }
    });
});

//Handle modal
let modal = document.querySelector('.shipping-modal');
let customerName = '';
let phoneNum = '';

document.addEventListener('click', function (e) {
    if (e.target.matches('.buy-btn')) {
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    }
});

document.querySelector('.shipping-modal').addEventListener('click', function (e) {
    if (e.target.matches('.submit-info')) {
        let inputName = document.querySelector('#name').value.trim();
        let inputPhoneNum = document.querySelector('#phone').value.trim();
        inputPhoneNum = inputPhoneNum.replace(/-/g, '');

        if (nameValid(inputName) && phoneValid(inputPhoneNum)) {
            customerName = inputName;
            phoneNum = inputPhoneNum;
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';

            let customerInfo =
                `
                    고객명 : ${customerName} / 연락처 : ${phoneNum}
                `;
            document.querySelector('.canvas-header h2').innerHTML = customerInfo;

            document.querySelector('.canvas-box').style.visibility = 'visible';
            document.querySelector('#canvas').setAttribute('height', (cartItems.length + 2) * 100);

            let canvas = document.querySelector('#canvas');
            let c = canvas.getContext('2d');
            let today = new Date();

            c.font = 'bold 2.4rem dotum';
            c.fillText('영수증', 20, 35);
            c.font = '1.6rem dotum';
            c.fillText(formatDate(today), 20, 60);

            let yPos = 100;
            cartItems.forEach((item, idx) => {
                c.font = 'bold 1.6rem dotum';
                c.fillText(item.title + ' / ' + item.brand, 20, yPos + 10);
                c.font = '1.6rem dotum';
                c.fillText('가격 : ' + item.price, 20, yPos + 30);
                c.fillText('수량 : ' + item.cnt, 20, yPos + 50);
                c.fillText('합계 : ' + item.price * item.cnt, 20, yPos + 70);
                yPos += 100;
            });

            c.fillText('총 합계 : ' + totalCost, 20, yPos + 40);
        } else if (!nameValid(inputName)) {
            alert('이름을 확인해주세요');
        } else {
            alert('연락처를 확인해주세요');
        }
    }

    if (e.target.matches('.close-modal')) {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
    }

    if (e.target.matches('.shipping-modal')) {
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
    }
});

document.querySelector('.canvas-close').addEventListener('click', () => {
    document.querySelector('.canvas-box').style.visibility = 'hidden';
});

//Shop list first rendering
function adjustList(data) {
    let goods = '';
    data.forEach((item, idx) => {
        goods =
            `
                <div class="shop-list col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="product-cards" draggable="true" item-id=${item.id}>
                        <div class="img-box">
                            <img src="./img/${item.photo}" draggable="false">
                        </div>
                        <div class="text-box">
                            <h2>${item.title}</h2>
                            <p>${item.brand}</p>
                            <h3>가격 : ${item.price}</h3>
                            <button type="button" class="btn btn-dark">담기</button>
                        </div>
                    </div>
                </div>
            `
        document.querySelector('.item-list').insertAdjacentHTML('beforeend', goods);
    });
}

//Cart item added
function cartItem(data) {
    let goods = '';

    calcCost(data);

    data.forEach((item, idx) => {
        goods =
            `
                <div class="shop-list col-12 col-sm-6 col-md-4 col-lg-3" draggable="false">
                    <div class="product-cards">
                        <div class="img-box">
                            <img src="./img/${item.photo}">
                        </div>
                        <div class="text-box">
                            <h2>${item.title}</h2>
                            <p>${item.brand}</p>
                            <h3>가격 : ${item.price}</h3>
                            <span>수량 : </span>
                            <input class='item-cnt' type='number' min='1' max='999' value='${item.cnt}'>
                        </div>
                        <div>
                            <i class="fa-solid fa-xmark del-btn"></i>
                        </div>
                    </div>
                </div>
            `
        document.querySelector('.cart-items').insertAdjacentHTML('beforeend', goods);
    });

    document.querySelectorAll('.cart-items *').forEach((item, idx) => {
        item.setAttribute('draggable', 'false');
    });
}

//Total cost
function calcCost(data) {
    let orderBox = document.querySelector('.order-box');

    if (data.length > 0) {
        totalCost = 0;

        data.forEach((item, idx) => {
            totalCost += item.cnt * item.price;
        });

        let costBox =
            `
                <h1>최종가격</h1>
                <h2>합계 : ${totalCost}</h2>
                <button type="button" class="btn btn-dark buy-btn">구매하기</button> 
            `
        orderBox.innerHTML = costBox;
    } else {
        document.querySelector('.cart-items').innerHTML = `<h1 class="cart-box-text">여기로 드래그</h1>`;
        document.querySelector('.cart-items').style.height = '20rem';
        orderBox.innerHTML = '';
    }
}

//name valid
function nameValid(name) {
    let nameTest = /^[A-Za-z가-힣]{1,}$/.test(name);
    return nameTest;
}

//cellphone valid
function phoneValid(phoneNum) {
    let phoneTest = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{3,4}$/.test(phoneNum);
    return phoneTest;
}

//Date 
function formatDate(date) {
    let yyyy = date.getFullYear();
    let MM = String(date.getMonth() + 1).padStart(2, '0');
    let dd = String(date.getDate()).padStart(2, '0');
    let HH = String(date.getHours()).padStart(2, '0');
    let mm = String(date.getMinutes()).padStart(2, '0');
    let ss = String(date.getSeconds()).padStart(2, '0');

    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
}